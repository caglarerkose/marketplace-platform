begin;

create sequence public.order_number_seq start with 100001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('BX-' || to_char(current_date, 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  source_cart_id uuid references public.customer_carts(id) on delete set null,
  checkout_key uuid not null default gen_random_uuid(),
  status text not null default 'created'
    check (status in ('created', 'awaiting_payment', 'paid', 'preparing', 'partially_shipped', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'authorized', 'paid', 'failed', 'cancelled', 'partially_refunded', 'refunded')),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  subtotal numeric(14,2) not null check (subtotal >= 0),
  discount_total numeric(14,2) not null default 0 check (discount_total >= 0),
  shipping_total numeric(14,2) not null default 0 check (shipping_total >= 0),
  grand_total numeric(14,2) generated always as (subtotal - discount_total + shipping_total) stored,
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  billing_address jsonb not null check (jsonb_typeof(billing_address) = 'object'),
  customer_note text,
  placed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_user_id, checkout_key),
  check (discount_total <= subtotal),
  check (char_length(coalesce(customer_note, '')) <= 1000)
);

create index orders_customer_time_idx on public.orders(customer_user_id, created_at desc);
create index orders_status_time_idx on public.orders(status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  offer_id uuid references public.seller_offers(id) on delete set null,
  product_id uuid references public.catalog_products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_title text not null check (char_length(trim(product_title)) between 1 and 240),
  variant_title text not null check (char_length(trim(variant_title)) between 1 and 160),
  seller_name text not null check (char_length(trim(seller_name)) between 1 and 120),
  seller_sku text not null check (char_length(trim(seller_sku)) between 1 and 100),
  product_image_url text,
  variant_attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(variant_attributes) = 'object'),
  quantity integer not null check (quantity between 1 and 999),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  discount_total numeric(14,2) not null default 0 check (discount_total >= 0),
  line_total numeric(14,2) generated always as ((unit_price * quantity) - discount_total) stored,
  fulfillment_status text not null default 'pending'
    check (fulfillment_status in ('pending', 'accepted', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_total <= unit_price * quantity)
);

create index order_items_order_idx on public.order_items(order_id);
create index order_items_store_status_idx on public.order_items(store_id, fulfillment_status, created_at desc);
create index order_items_offer_idx on public.order_items(offer_id);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete cascade,
  previous_status text,
  new_status text not null,
  note text check (char_length(coalesce(note, '')) <= 1000),
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_history_order_time_idx on public.order_status_history(order_id, created_at desc);

create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger order_items_set_updated_at before update on public.order_items
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

revoke all on table public.orders, public.order_items, public.order_status_history from anon, authenticated;
grant select on table public.orders, public.order_items, public.order_status_history to authenticated;
grant select, insert, update, delete on table public.orders, public.order_items, public.order_status_history to service_role;
grant usage, select on sequence public.order_number_seq, public.order_status_history_id_seq to service_role;

create policy "orders_customer_select" on public.orders for select to authenticated
using ((select auth.uid()) = customer_user_id);

create policy "orders_store_member_select" on public.orders for select to authenticated
using (exists (
  select 1 from public.order_items item
  join public.store_members member on member.store_id = item.store_id
  where item.order_id = orders.id
    and member.user_id = (select auth.uid())
    and member.status = 'active'
));

create policy "order_items_customer_select" on public.order_items for select to authenticated
using (exists (
  select 1 from public.orders customer_order
  where customer_order.id = order_id and customer_order.customer_user_id = (select auth.uid())
));

create policy "order_items_store_member_select" on public.order_items for select to authenticated
using (exists (
  select 1 from public.store_members member
  where member.store_id = order_items.store_id
    and member.user_id = (select auth.uid())
    and member.status = 'active'
));

create policy "order_history_customer_select" on public.order_status_history for select to authenticated
using (exists (
  select 1 from public.orders customer_order
  where customer_order.id = order_id and customer_order.customer_user_id = (select auth.uid())
));

create policy "order_history_store_member_select" on public.order_status_history for select to authenticated
using (exists (
  select 1 from public.order_items item
  join public.store_members member on member.store_id = item.store_id
  where item.order_id = order_status_history.order_id
    and (order_status_history.order_item_id is null or item.id = order_status_history.order_item_id)
    and member.user_id = (select auth.uid())
    and member.status = 'active'
));

commit;
