begin;

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  address jsonb not null default '{}'::jsonb check (jsonb_typeof(address) = 'object'),
  status text not null default 'active' check (status in ('active', 'passive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, code)
);

create index warehouses_store_status_idx on public.warehouses (store_id, status);

create table public.inventory_balances (
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  offer_id uuid not null references public.seller_offers(id) on delete cascade,
  on_hand integer not null default 0 check (on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= on_hand),
  available integer generated always as (on_hand - reserved) stored,
  version bigint not null default 0 check (version >= 0),
  updated_at timestamptz not null default now(),
  primary key (warehouse_id, offer_id)
);

create index inventory_balances_offer_idx on public.inventory_balances (offer_id);
create index inventory_balances_available_idx on public.inventory_balances (available);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null,
  offer_id uuid not null,
  reference_type text not null check (reference_type in ('cart', 'checkout', 'order')),
  reference_id text not null check (char_length(trim(reference_id)) between 1 and 160),
  quantity integer not null check (quantity > 0),
  status text not null default 'active'
    check (status in ('active', 'converted', 'released', 'expired')),
  expires_at timestamptz not null,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (warehouse_id, offer_id)
    references public.inventory_balances(warehouse_id, offer_id)
    on delete restrict
);

create index inventory_reservations_reference_idx
  on public.inventory_reservations (reference_type, reference_id);
create index inventory_reservations_expiry_idx
  on public.inventory_reservations (status, expires_at)
  where status = 'active';

create table public.inventory_transactions (
  id bigint generated always as identity primary key,
  warehouse_id uuid not null,
  offer_id uuid not null,
  reservation_id uuid references public.inventory_reservations(id) on delete set null,
  transaction_type text not null
    check (transaction_type in ('adjustment', 'reservation', 'release', 'sale', 'return')),
  quantity_delta integer not null check (quantity_delta <> 0),
  on_hand_after integer not null check (on_hand_after >= 0),
  reserved_after integer not null check (reserved_after >= 0 and reserved_after <= on_hand_after),
  reference_type text,
  reference_id text,
  idempotency_key text unique,
  actor_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (warehouse_id, offer_id)
    references public.inventory_balances(warehouse_id, offer_id)
    on delete restrict
);

create index inventory_transactions_balance_time_idx
  on public.inventory_transactions (warehouse_id, offer_id, created_at desc);
create index inventory_transactions_reference_idx
  on public.inventory_transactions (reference_type, reference_id);

create trigger warehouses_set_updated_at
before update on public.warehouses
for each row execute function public.set_updated_at();

create trigger inventory_balances_set_updated_at
before update on public.inventory_balances
for each row execute function public.set_updated_at();

create trigger inventory_reservations_set_updated_at
before update on public.inventory_reservations
for each row execute function public.set_updated_at();

create or replace function public.reserve_inventory(
  p_warehouse_id uuid,
  p_offer_id uuid,
  p_quantity integer,
  p_reference_type text,
  p_reference_id text,
  p_expires_at timestamptz,
  p_actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  balance public.inventory_balances%rowtype;
  reservation_id uuid;
begin
  if p_quantity <= 0 or p_expires_at <= now() then
    raise exception 'Invalid inventory reservation';
  end if;

  select * into balance
  from public.inventory_balances
  where warehouse_id = p_warehouse_id and offer_id = p_offer_id
  for update;

  if not found or balance.available < p_quantity then
    raise exception 'Insufficient inventory';
  end if;

  update public.inventory_balances
  set reserved = reserved + p_quantity,
      version = version + 1
  where warehouse_id = p_warehouse_id and offer_id = p_offer_id
  returning * into balance;

  insert into public.inventory_reservations (
    warehouse_id, offer_id, reference_type, reference_id, quantity, expires_at
  ) values (
    p_warehouse_id, p_offer_id, p_reference_type, p_reference_id, p_quantity, p_expires_at
  ) returning id into reservation_id;

  insert into public.inventory_transactions (
    warehouse_id, offer_id, reservation_id, transaction_type, quantity_delta,
    on_hand_after, reserved_after, reference_type, reference_id, actor_user_id
  ) values (
    p_warehouse_id, p_offer_id, reservation_id, 'reservation', p_quantity,
    balance.on_hand, balance.reserved, p_reference_type, p_reference_id, p_actor_user_id
  );

  return reservation_id;
end;
$$;

create or replace function public.release_inventory_reservation(
  p_reservation_id uuid,
  p_status text default 'released',
  p_actor_user_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reservation public.inventory_reservations%rowtype;
  balance public.inventory_balances%rowtype;
begin
  if p_status not in ('released', 'expired') then
    raise exception 'Invalid reservation release status';
  end if;

  select * into reservation
  from public.inventory_reservations
  where id = p_reservation_id
  for update;

  if not found or reservation.status <> 'active' then
    return false;
  end if;

  update public.inventory_balances
  set reserved = reserved - reservation.quantity,
      version = version + 1
  where warehouse_id = reservation.warehouse_id
    and offer_id = reservation.offer_id
  returning * into balance;

  update public.inventory_reservations
  set status = p_status, released_at = now()
  where id = p_reservation_id;

  insert into public.inventory_transactions (
    warehouse_id, offer_id, reservation_id, transaction_type, quantity_delta,
    on_hand_after, reserved_after, reference_type, reference_id, actor_user_id
  ) values (
    reservation.warehouse_id, reservation.offer_id, reservation.id, 'release',
    -reservation.quantity, balance.on_hand, balance.reserved,
    reservation.reference_type, reservation.reference_id, p_actor_user_id
  );

  return true;
end;
$$;

alter table public.warehouses enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.inventory_transactions enable row level security;

revoke all on table public.warehouses from anon, authenticated;
revoke all on table public.inventory_balances from anon, authenticated;
revoke all on table public.inventory_reservations from anon, authenticated;
revoke all on table public.inventory_transactions from anon, authenticated;

grant select on table public.warehouses to authenticated;
grant select on table public.inventory_balances to authenticated;
grant select on table public.inventory_reservations to authenticated;
grant select on table public.inventory_transactions to authenticated;

grant select, insert, update, delete on table public.warehouses to service_role;
grant select, insert, update, delete on table public.inventory_balances to service_role;
grant select, insert, update, delete on table public.inventory_reservations to service_role;
grant select, insert on table public.inventory_transactions to service_role;
grant usage, select on sequence public.inventory_transactions_id_seq to service_role;

create policy "warehouses_select_store_member"
on public.warehouses for select to authenticated
using (exists (
  select 1 from public.store_members member
  where member.store_id = warehouses.store_id
    and member.user_id = (select auth.uid())
    and member.status = 'active'
));

create policy "inventory_balances_select_store_member"
on public.inventory_balances for select to authenticated
using (exists (
  select 1
  from public.warehouses warehouse
  join public.store_members member on member.store_id = warehouse.store_id
  where warehouse.id = inventory_balances.warehouse_id
    and member.user_id = (select auth.uid())
    and member.status = 'active'
));

create policy "inventory_reservations_select_store_member"
on public.inventory_reservations for select to authenticated
using (exists (
  select 1
  from public.warehouses warehouse
  join public.store_members member on member.store_id = warehouse.store_id
  where warehouse.id = inventory_reservations.warehouse_id
    and member.user_id = (select auth.uid())
    and member.status = 'active'
));

create policy "inventory_transactions_select_store_member"
on public.inventory_transactions for select to authenticated
using (exists (
  select 1
  from public.warehouses warehouse
  join public.store_members member on member.store_id = warehouse.store_id
  where warehouse.id = inventory_transactions.warehouse_id
    and member.user_id = (select auth.uid())
    and member.status = 'active'
));

revoke all on function public.reserve_inventory(uuid, uuid, integer, text, text, timestamptz, uuid) from public;
revoke all on function public.release_inventory_reservation(uuid, text, uuid) from public;
grant execute on function public.reserve_inventory(uuid, uuid, integer, text, text, timestamptz, uuid) to service_role;
grant execute on function public.release_inventory_reservation(uuid, text, uuid) to service_role;

commit;
