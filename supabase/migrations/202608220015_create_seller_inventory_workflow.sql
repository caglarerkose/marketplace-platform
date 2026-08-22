begin;

create or replace function public.ensure_default_warehouse(p_store_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare warehouse_id uuid;
begin
  select id into warehouse_id from public.warehouses
  where store_id = p_store_id and code = 'DEFAULT';
  if warehouse_id is null then
    insert into public.warehouses (store_id, name, code, status)
    values (p_store_id, 'Ana Depo', 'DEFAULT', 'active')
    on conflict (store_id, code) do update set status = 'active'
    returning id into warehouse_id;
  end if;
  return warehouse_id;
end;
$$;

create or replace function public.initialize_store_inventory()
returns trigger language plpgsql security definer set search_path = public as $$
declare warehouse_id uuid;
begin
  warehouse_id := public.ensure_default_warehouse(new.store_id);
  insert into public.inventory_balances (warehouse_id, offer_id)
  values (warehouse_id, new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists seller_offers_initialize_inventory on public.seller_offers;
create trigger seller_offers_initialize_inventory
after insert on public.seller_offers
for each row execute function public.initialize_store_inventory();

do $$ declare store_record record; offer_record record; warehouse_id uuid;
begin
  for store_record in select id from public.stores loop
    warehouse_id := public.ensure_default_warehouse(store_record.id);
    for offer_record in select id from public.seller_offers where store_id = store_record.id loop
      insert into public.inventory_balances (warehouse_id, offer_id)
      values (warehouse_id, offer_record.id) on conflict do nothing;
    end loop;
  end loop;
end $$;

create or replace function public.adjust_store_inventory(
  p_actor_user_id uuid,
  p_warehouse_id uuid,
  p_offer_id uuid,
  p_new_on_hand integer,
  p_reason text
)
returns table (on_hand integer, reserved integer, available integer)
language plpgsql
security definer
set search_path = public, auth
as $$
declare current_balance public.inventory_balances%rowtype;
declare previous_on_hand integer;
begin
  if p_new_on_hand < 0 then raise exception 'invalid_stock_quantity'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'stock_reason_required'; end if;
  if not exists (
    select 1 from public.warehouses warehouse
    join public.store_members member on member.store_id = warehouse.store_id
    where warehouse.id = p_warehouse_id and member.user_id = p_actor_user_id
      and member.status = 'active' and member.role in ('owner', 'admin', 'catalog')
  ) then raise exception 'inventory_access_denied'; end if;

  select * into current_balance from public.inventory_balances
  where warehouse_id = p_warehouse_id and offer_id = p_offer_id for update;
  if not found then raise exception 'inventory_balance_not_found'; end if;
  if p_new_on_hand < current_balance.reserved then raise exception 'stock_below_reserved'; end if;
  previous_on_hand := current_balance.on_hand;
  if p_new_on_hand = previous_on_hand then
    return query select current_balance.on_hand, current_balance.reserved, current_balance.available;
    return;
  end if;

  update public.inventory_balances set on_hand = p_new_on_hand, version = version + 1
  where warehouse_id = p_warehouse_id and offer_id = p_offer_id returning * into current_balance;
  insert into public.inventory_transactions (
    warehouse_id, offer_id, transaction_type, quantity_delta, on_hand_after,
    reserved_after, reference_type, reference_id, actor_user_id, metadata
  ) values (
    p_warehouse_id, p_offer_id, 'adjustment', p_new_on_hand - previous_on_hand,
    current_balance.on_hand, current_balance.reserved, 'manual', gen_random_uuid()::text,
    p_actor_user_id, jsonb_build_object('reason', trim(p_reason))
  );
  return query select current_balance.on_hand, current_balance.reserved, current_balance.available;
end;
$$;

revoke all on function public.ensure_default_warehouse(uuid) from public, anon, authenticated;
revoke all on function public.adjust_store_inventory(uuid, uuid, uuid, integer, text) from public, anon, authenticated;
grant execute on function public.ensure_default_warehouse(uuid) to service_role;
grant execute on function public.adjust_store_inventory(uuid, uuid, uuid, integer, text) to service_role;

commit;
