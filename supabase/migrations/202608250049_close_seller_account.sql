begin;

create or replace function public.close_seller_account(
  p_seller_id uuid,
  p_actor_id uuid
)
returns table (seller_id uuid, closed_store_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_stores integer;
begin
  if not exists (
    select 1 from public.sellers
    where id = p_seller_id and status <> 'closed'
  ) then
    raise exception 'seller_not_found_or_closed';
  end if;

  update public.seller_offers
  set status = 'archived', updated_at = now()
  where store_id in (
    select id from public.stores where stores.seller_id = p_seller_id
  ) and status <> 'archived';

  update public.store_members
  set status = 'passive', updated_at = now()
  where store_id in (
    select id from public.stores where stores.seller_id = p_seller_id
  ) and status <> 'passive';

  update public.stores
  set status = 'passive', updated_at = now()
  where stores.seller_id = p_seller_id;
  get diagnostics affected_stores = row_count;

  update public.sellers
  set status = 'closed', updated_at = now()
  where id = p_seller_id;

  return query select p_seller_id, affected_stores;
end;
$$;

revoke all on function public.close_seller_account(uuid, uuid) from public, anon, authenticated;
grant execute on function public.close_seller_account(uuid, uuid) to service_role;

commit;
