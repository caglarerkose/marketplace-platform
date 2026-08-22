begin;

create table public.customer_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index customer_carts_active_user_idx on public.customer_carts(user_id) where status = 'active';
create index customer_carts_user_time_idx on public.customer_carts(user_id, updated_at desc);

create table public.customer_cart_items (
  cart_id uuid not null references public.customer_carts(id) on delete cascade,
  offer_id uuid not null references public.seller_offers(id) on delete restrict,
  quantity integer not null default 1 check (quantity between 1 and 999),
  is_selected boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cart_id, offer_id)
);

create table public.customer_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create trigger customer_carts_set_updated_at before update on public.customer_carts
for each row execute function public.set_updated_at();
create trigger customer_cart_items_set_updated_at before update on public.customer_cart_items
for each row execute function public.set_updated_at();

alter table public.customer_carts enable row level security;
alter table public.customer_cart_items enable row level security;
alter table public.customer_favorites enable row level security;
revoke all on table public.customer_carts, public.customer_cart_items, public.customer_favorites from anon, authenticated;
grant select, insert, update, delete on table public.customer_carts, public.customer_cart_items, public.customer_favorites to authenticated;

create policy "customer_carts_own" on public.customer_carts for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customer_cart_items_own" on public.customer_cart_items for all to authenticated
using (exists (select 1 from public.customer_carts cart where cart.id = cart_id and cart.user_id = (select auth.uid())))
with check (exists (select 1 from public.customer_carts cart where cart.id = cart_id and cart.user_id = (select auth.uid())));
create policy "customer_favorites_own" on public.customer_favorites for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

commit;
