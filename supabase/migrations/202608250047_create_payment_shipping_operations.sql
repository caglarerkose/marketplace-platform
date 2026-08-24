begin;

create table if not exists public.payment_intents(
 id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.orders(id) on delete restrict,
 provider text not null default 'manual' check(char_length(trim(provider)) between 2 and 50),provider_reference text,
 amount numeric(14,2) not null check(amount>=0),currency text not null default 'TRY' check(currency~'^[A-Z]{3}$'),
 status text not null default 'created' check(status in('created','pending','authorized','captured','failed','cancelled','partially_refunded','refunded')),
 idempotency_key uuid not null default gen_random_uuid() unique,failure_code text,failure_message text,
 authorized_at timestamptz,captured_at timestamptz,cancelled_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.payment_transactions(
 id uuid primary key default gen_random_uuid(),payment_intent_id uuid not null references public.payment_intents(id) on delete restrict,
 transaction_type text not null check(transaction_type in('authorize','capture','void','refund','adjustment')),
 amount numeric(14,2) not null check(amount>0),status text not null check(status in('pending','succeeded','failed')),
 provider_transaction_id text,idempotency_key uuid not null default gen_random_uuid() unique,response_code text,response_message text,
 processed_at timestamptz,created_at timestamptz not null default now()
);
create table if not exists public.payment_refunds(
 id uuid primary key default gen_random_uuid(),payment_intent_id uuid not null references public.payment_intents(id) on delete restrict,
 order_request_id uuid references public.order_requests(id) on delete set null,amount numeric(14,2) not null check(amount>0),reason text not null,
 status text not null default 'requested' check(status in('requested','approved','processing','succeeded','failed','cancelled')),
 provider_reference text,requested_by uuid references auth.users(id) on delete set null,approved_by uuid references public.admin_users(user_id) on delete set null,
 processed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.shipment_packages(
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete restrict,store_id uuid not null references public.stores(id) on delete restrict,
 package_number text not null unique default('PK-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),carrier_code text,carrier_name text,
 tracking_number text,tracking_url text,status text not null default 'preparing' check(status in('preparing','ready','shipped','in_transit','out_for_delivery','delivered','delivery_failed','returned','cancelled')),
 estimated_delivery_at timestamptz,shipped_at timestamptz,delivered_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(carrier_code,tracking_number)
);
create table if not exists public.shipment_package_items(
 package_id uuid not null references public.shipment_packages(id) on delete cascade,order_item_id uuid not null references public.order_items(id) on delete restrict,
 quantity integer not null check(quantity between 1 and 999),primary key(package_id,order_item_id)
);
create table if not exists public.shipment_events(
 id bigint generated always as identity primary key,package_id uuid not null references public.shipment_packages(id) on delete cascade,
 event_code text not null,status text not null,description text,location text,provider_event_id text,event_at timestamptz not null,created_at timestamptz not null default now(),
 unique(package_id,provider_event_id)
);

create index if not exists payment_transactions_intent_idx on public.payment_transactions(payment_intent_id,created_at desc);
create index if not exists payment_refunds_intent_idx on public.payment_refunds(payment_intent_id,created_at desc);
create index if not exists shipment_packages_order_idx on public.shipment_packages(order_id,status);
create index if not exists shipment_packages_store_idx on public.shipment_packages(store_id,status,created_at desc);
create index if not exists shipment_events_package_idx on public.shipment_events(package_id,event_at desc);
drop trigger if exists payment_intents_set_updated_at on public.payment_intents;create trigger payment_intents_set_updated_at before update on public.payment_intents for each row execute function public.set_updated_at();
drop trigger if exists payment_refunds_set_updated_at on public.payment_refunds;create trigger payment_refunds_set_updated_at before update on public.payment_refunds for each row execute function public.set_updated_at();
drop trigger if exists shipment_packages_set_updated_at on public.shipment_packages;create trigger shipment_packages_set_updated_at before update on public.shipment_packages for each row execute function public.set_updated_at();

alter table public.payment_intents enable row level security;alter table public.payment_transactions enable row level security;alter table public.payment_refunds enable row level security;
alter table public.shipment_packages enable row level security;alter table public.shipment_package_items enable row level security;alter table public.shipment_events enable row level security;
revoke all on table public.payment_intents,public.payment_transactions,public.payment_refunds,public.shipment_packages,public.shipment_package_items,public.shipment_events from anon,authenticated;
grant select on table public.payment_intents,public.payment_transactions,public.payment_refunds,public.shipment_packages,public.shipment_package_items,public.shipment_events to authenticated;
grant select,insert,update,delete on table public.payment_intents,public.payment_transactions,public.payment_refunds,public.shipment_packages,public.shipment_package_items,public.shipment_events to service_role;
grant usage,select on sequence public.shipment_events_id_seq to service_role;

create policy "payment intent participants read" on public.payment_intents for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_user_id=(select auth.uid()) or exists(select 1 from public.order_items i join public.store_members m on m.store_id=i.store_id where i.order_id=o.id and m.user_id=(select auth.uid()) and m.status='active'))));
create policy "payment transaction participants read" on public.payment_transactions for select to authenticated using(exists(select 1 from public.payment_intents p join public.orders o on o.id=p.order_id where p.id=payment_intent_id and (o.customer_user_id=(select auth.uid()) or exists(select 1 from public.order_items i join public.store_members m on m.store_id=i.store_id where i.order_id=o.id and m.user_id=(select auth.uid()) and m.status='active'))));
create policy "payment refund participants read" on public.payment_refunds for select to authenticated using(exists(select 1 from public.payment_intents p join public.orders o on o.id=p.order_id where p.id=payment_intent_id and (o.customer_user_id=(select auth.uid()) or exists(select 1 from public.order_items i join public.store_members m on m.store_id=i.store_id where i.order_id=o.id and m.user_id=(select auth.uid()) and m.status='active'))));
create policy "shipment participants read" on public.shipment_packages for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_user_id=(select auth.uid()) or exists(select 1 from public.store_members m where m.store_id=shipment_packages.store_id and m.user_id=(select auth.uid()) and m.status='active'))));
create policy "shipment items participants read" on public.shipment_package_items for select to authenticated using(exists(select 1 from public.shipment_packages p join public.orders o on o.id=p.order_id where p.id=package_id and (o.customer_user_id=(select auth.uid()) or exists(select 1 from public.store_members m where m.store_id=p.store_id and m.user_id=(select auth.uid()) and m.status='active'))));
create policy "shipment events participants read" on public.shipment_events for select to authenticated using(exists(select 1 from public.shipment_packages p join public.orders o on o.id=p.order_id where p.id=package_id and (o.customer_user_id=(select auth.uid()) or exists(select 1 from public.store_members m where m.store_id=p.store_id and m.user_id=(select auth.uid()) and m.status='active'))));
commit;
