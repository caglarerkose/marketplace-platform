begin;

create table public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  brand_id uuid references public.brands(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 240),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'active', 'rejected', 'archived')),
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_products_category_status_idx
  on public.catalog_products (category_id, status, created_at desc);
create index catalog_products_brand_status_idx
  on public.catalog_products (brand_id, status, created_at desc);
create index catalog_products_title_search_idx
  on public.catalog_products using gin (to_tsvector('simple', title));

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  sku text not null unique check (char_length(trim(sku)) between 2 and 80),
  barcode text unique check (barcode is null or char_length(trim(barcode)) between 8 and 32),
  title text not null check (char_length(trim(title)) between 1 and 160),
  attribute_values jsonb not null default '{}'::jsonb
    check (jsonb_typeof(attribute_values) = 'object'),
  status text not null default 'active'
    check (status in ('active', 'passive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_variants_product_status_idx
  on public.product_variants (product_id, status);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  url text not null check (char_length(trim(url)) between 1 and 2048),
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_media_product_sort_idx
  on public.product_media (product_id, sort_order, created_at);
create unique index product_media_primary_product_idx
  on public.product_media (product_id)
  where is_primary = true and variant_id is null;
create unique index product_media_primary_variant_idx
  on public.product_media (variant_id)
  where is_primary = true and variant_id is not null;

create table public.seller_offers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  seller_sku text not null check (char_length(trim(seller_sku)) between 1 and 100),
  price numeric(14,2) not null check (price >= 0),
  list_price numeric(14,2) check (list_price is null or list_price >= price),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'passive', 'rejected', 'archived')),
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, variant_id),
  unique (store_id, seller_sku)
);

create index seller_offers_variant_status_price_idx
  on public.seller_offers (variant_id, status, price);
create index seller_offers_store_status_idx
  on public.seller_offers (store_id, status, updated_at desc);

create trigger catalog_products_set_updated_at
before update on public.catalog_products
for each row execute function public.set_updated_at();

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create trigger seller_offers_set_updated_at
before update on public.seller_offers
for each row execute function public.set_updated_at();

alter table public.catalog_products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.seller_offers enable row level security;

revoke all on table public.catalog_products from anon, authenticated;
revoke all on table public.product_variants from anon, authenticated;
revoke all on table public.product_media from anon, authenticated;
revoke all on table public.seller_offers from anon, authenticated;

grant select on table public.catalog_products to anon, authenticated;
grant select on table public.product_variants to anon, authenticated;
grant select on table public.product_media to anon, authenticated;
grant select on table public.seller_offers to anon, authenticated;

grant select, insert, update, delete on table public.catalog_products to service_role;
grant select, insert, update, delete on table public.product_variants to service_role;
grant select, insert, update, delete on table public.product_media to service_role;
grant select, insert, update, delete on table public.seller_offers to service_role;

create policy "catalog_products_read_active"
on public.catalog_products for select
to anon, authenticated
using (status = 'active');

create policy "product_variants_read_active"
on public.product_variants for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.catalog_products product
    where product.id = product_id and product.status = 'active'
  )
);

create policy "product_media_read_active"
on public.product_media for select
to anon, authenticated
using (
  exists (
    select 1 from public.catalog_products product
    where product.id = product_id and product.status = 'active'
  )
);

create policy "seller_offers_read_active"
on public.seller_offers for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1 from public.stores store
    where store.id = store_id and store.status = 'active'
  )
  and exists (
    select 1
    from public.product_variants variant
    join public.catalog_products product on product.id = variant.product_id
    where variant.id = variant_id
      and variant.status = 'active'
      and product.status = 'active'
  )
);

create policy "seller_offers_select_store_member"
on public.seller_offers for select
to authenticated
using (
  exists (
    select 1 from public.store_members member
    where member.store_id = store_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
  )
);

commit;
