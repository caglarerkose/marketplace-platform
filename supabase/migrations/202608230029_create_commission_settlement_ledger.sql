begin;

create table public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  commission_rate numeric(5,2) not null check (commission_rate between 0 and 100),
  service_fee_rate numeric(5,2) not null default 0 check (service_fee_rate between 0 and 100),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'active' check (status in ('active', 'passive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (category_id is not null or store_id is not null),
  check (ends_at is null or ends_at > starts_at)
);

create index commission_rules_lookup_idx on public.commission_rules(store_id, category_id, status, starts_at desc);

create table public.seller_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  order_item_id uuid references public.order_items(id) on delete restrict,
  entry_type text not null check (entry_type in ('sale', 'commission', 'service_fee', 'refund', 'adjustment', 'settlement')),
  amount numeric(14,2) not null check (amount <> 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  description text not null check (char_length(trim(description)) between 2 and 500),
  available_at timestamptz not null default now(),
  settlement_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index seller_ledger_sale_once_idx on public.seller_ledger_entries(order_item_id, entry_type)
where order_item_id is not null and entry_type in ('sale', 'commission', 'service_fee');
create index seller_ledger_store_available_idx on public.seller_ledger_entries(store_id, available_at, created_at);
create index seller_ledger_order_idx on public.seller_ledger_entries(order_id, order_item_id);

create table public.seller_settlements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  gross_amount numeric(14,2) not null default 0,
  deduction_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2) generated always as (gross_amount - deduction_amount) stored,
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft', 'approved', 'payment_pending', 'paid', 'cancelled')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  paid_at timestamptz,
  reference text check (reference is null or char_length(trim(reference)) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, period_start, period_end),
  check (period_end >= period_start)
);

alter table public.seller_ledger_entries
  add constraint seller_ledger_settlement_fk foreign key(settlement_id) references public.seller_settlements(id) on delete set null;
create index seller_settlements_store_period_idx on public.seller_settlements(store_id, period_end desc);

create trigger commission_rules_set_updated_at before update on public.commission_rules
for each row execute function public.set_updated_at();
create trigger seller_settlements_set_updated_at before update on public.seller_settlements
for each row execute function public.set_updated_at();

create or replace function public.post_delivered_order_item_to_ledger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  category_value uuid;
  rule_record public.commission_rules%rowtype;
  gross_value numeric(14,2);
begin
  if old.fulfillment_status = 'delivered' or new.fulfillment_status <> 'delivered' then return new; end if;
  gross_value := new.line_total;
  select product.category_id into category_value from public.catalog_products product where product.id = new.product_id;
  select * into rule_record from public.commission_rules rule
  where rule.status = 'active' and rule.starts_at <= now() and (rule.ends_at is null or rule.ends_at > now())
    and (rule.store_id = new.store_id or (rule.store_id is null and rule.category_id = category_value))
  order by (rule.store_id is not null) desc, rule.starts_at desc limit 1;

  insert into public.seller_ledger_entries(store_id, order_id, order_item_id, entry_type, amount, description, available_at)
  values(new.store_id, new.order_id, new.id, 'sale', gross_value, 'Teslim edilen sipariş satışı', now() + interval '14 days')
  on conflict do nothing;
  if found and rule_record.id is not null then
    insert into public.seller_ledger_entries(store_id, order_id, order_item_id, entry_type, amount, description, available_at)
    values(new.store_id, new.order_id, new.id, 'commission', -(gross_value * rule_record.commission_rate / 100), 'Pazaryeri komisyonu', now() + interval '14 days') on conflict do nothing;
    if rule_record.service_fee_rate > 0 then
      insert into public.seller_ledger_entries(store_id, order_id, order_item_id, entry_type, amount, description, available_at)
      values(new.store_id, new.order_id, new.id, 'service_fee', -(gross_value * rule_record.service_fee_rate / 100), 'Hizmet bedeli', now() + interval '14 days') on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

create trigger order_items_post_seller_ledger after update of fulfillment_status on public.order_items
for each row execute function public.post_delivered_order_item_to_ledger();

create or replace function public.create_seller_settlement(p_store_id uuid, p_period_start date, p_period_end date)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare user_id uuid := auth.uid(); v_settlement_id uuid; gross numeric(14,2); deductions numeric(14,2);
begin
  if user_id is null or not exists(select 1 from public.admin_users admin_user where admin_user.user_id=user_id and admin_user.status='active') then raise exception 'admin_access_denied'; end if;
  if p_period_end < p_period_start then raise exception 'invalid_period'; end if;
  select coalesce(sum(amount) filter(where amount > 0),0), abs(coalesce(sum(amount) filter(where amount < 0),0)) into gross,deductions
  from public.seller_ledger_entries where store_id=p_store_id and settlement_id is null and available_at<=now() and created_at::date between p_period_start and p_period_end;
  if gross = 0 and deductions = 0 then raise exception 'no_available_entries'; end if;
  insert into public.seller_settlements(store_id,period_start,period_end,gross_amount,deduction_amount)
  values(p_store_id,p_period_start,p_period_end,gross,deductions) returning id into v_settlement_id;
  update public.seller_ledger_entries set settlement_id=v_settlement_id where store_id=p_store_id and seller_ledger_entries.settlement_id is null and available_at<=now() and created_at::date between p_period_start and p_period_end;
  return v_settlement_id;
end;
$$;

alter table public.commission_rules enable row level security;
alter table public.seller_ledger_entries enable row level security;
alter table public.seller_settlements enable row level security;
revoke all on table public.commission_rules,public.seller_ledger_entries,public.seller_settlements from anon,authenticated;
grant select on table public.commission_rules,public.seller_ledger_entries,public.seller_settlements to authenticated;
grant select,insert,update,delete on table public.commission_rules,public.seller_ledger_entries,public.seller_settlements to service_role;

create policy "commission_rules_seller_read" on public.commission_rules for select to authenticated
using(store_id is null or exists(select 1 from public.store_members member where member.store_id=commission_rules.store_id and member.user_id=(select auth.uid()) and member.status='active'));
create policy "seller_ledger_store_read" on public.seller_ledger_entries for select to authenticated
using(exists(select 1 from public.store_members member where member.store_id=seller_ledger_entries.store_id and member.user_id=(select auth.uid()) and member.status='active'));
create policy "seller_settlements_store_read" on public.seller_settlements for select to authenticated
using(exists(select 1 from public.store_members member where member.store_id=seller_settlements.store_id and member.user_id=(select auth.uid()) and member.status='active'));

revoke all on function public.create_seller_settlement(uuid,date,date) from public,anon;
grant execute on function public.create_seller_settlement(uuid,date,date) to authenticated,service_role;

commit;
