begin;

create or replace function public.decide_order_request(
  p_request_id uuid,
  p_actor_user_id uuid,
  p_decision text,
  p_note text
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  request_record public.order_requests%rowtype;
  item_record public.order_items%rowtype;
  reservation_record record;
  next_status text;
begin
  if p_actor_user_id is null or p_decision not in ('approve', 'reject') then
    raise exception 'invalid_decision';
  end if;
  if char_length(trim(coalesce(p_note, ''))) < 3 then raise exception 'decision_note_required'; end if;

  select * into request_record from public.order_requests
  where id = p_request_id for update;
  if not found then raise exception 'request_not_found'; end if;
  if request_record.status not in ('submitted', 'under_review') then
    raise exception 'request_already_decided';
  end if;

  if not exists (
    select 1 from public.admin_users admin_user
    where admin_user.user_id = p_actor_user_id and admin_user.status = 'active'
  ) and not exists (
    select 1 from public.store_members member
    where member.store_id = request_record.store_id
      and member.user_id = p_actor_user_id
      and member.status = 'active'
      and member.role in ('owner', 'admin', 'orders')
  ) then raise exception 'request_decision_access_denied'; end if;

  select * into item_record from public.order_items
  where id = request_record.order_item_id for update;
  if not found then raise exception 'order_item_not_found'; end if;
  next_status := case when p_decision = 'approve' then 'approved' else 'rejected' end;

  if p_decision = 'approve' and request_record.request_type = 'cancellation' then
    if item_record.fulfillment_status in ('shipped', 'delivered', 'returned') then
      raise exception 'cancellation_not_available';
    end if;
    for reservation_record in
      select reservation.id from public.inventory_reservations reservation
      where reservation.offer_id = item_record.offer_id
        and reservation.reference_type = 'order'
        and reservation.reference_id = item_record.order_id::text
        and reservation.status = 'active'
      for update
    loop
      perform public.release_inventory_reservation(
        reservation_record.id, 'released', p_actor_user_id
      );
    end loop;
    update public.order_items set fulfillment_status = 'cancelled'
    where id = item_record.id;
    if not exists (
      select 1 from public.order_items sibling
      where sibling.order_id = item_record.order_id
        and sibling.id <> item_record.id
        and sibling.fulfillment_status <> 'cancelled'
    ) then
      update public.orders set status = 'cancelled', cancelled_at = now()
      where id = item_record.order_id;
    end if;
  elsif p_decision = 'approve' and request_record.request_type = 'return' then
    if item_record.fulfillment_status <> 'delivered' then
      raise exception 'return_not_available';
    end if;
    update public.order_items set fulfillment_status = 'returned'
    where id = item_record.id;
  end if;

  update public.order_requests
  set status = next_status, resolution_note = trim(p_note),
      reviewed_by = p_actor_user_id, reviewed_at = now()
  where id = request_record.id;

  insert into public.order_request_history (
    request_id, previous_status, new_status, note, actor_user_id
  ) values (
    request_record.id, request_record.status, next_status, trim(p_note), p_actor_user_id
  );

  insert into public.order_status_history (
    order_id, order_item_id, previous_status, new_status, note, actor_user_id
  ) values (
    item_record.order_id, item_record.id, item_record.fulfillment_status,
    case when p_decision = 'reject' then item_record.fulfillment_status
         when request_record.request_type = 'cancellation' then 'cancelled'
         else 'returned' end,
    trim(p_note), p_actor_user_id
  );

  return next_status;
end;
$$;

revoke all on function public.decide_order_request(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.decide_order_request(uuid, uuid, text, text) to service_role;

commit;
