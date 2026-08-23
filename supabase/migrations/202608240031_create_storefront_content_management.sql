begin;

create table public.storefront_content_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique check (block_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  block_type text not null check (block_type in ('hero', 'product_showcase', 'category_showcase', 'campaign_band', 'promo')),
  title text check (title is null or char_length(trim(title)) <= 160),
  subtitle text check (subtitle is null or char_length(trim(subtitle)) <= 500),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  sort_order integer not null default 0 check (sort_order >= 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'paused', 'ended')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index storefront_content_blocks_publication_idx on public.storefront_content_blocks(status,sort_order,starts_at,ends_at);

create table public.storefront_navigation_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.storefront_navigation_items(id) on delete cascade,
  placement text not null check (placement in ('header', 'footer', 'mobile')),
  label text not null check (char_length(trim(label)) between 1 and 80),
  item_type text not null check (item_type in ('category', 'campaign', 'page', 'external')),
  target text not null check (char_length(trim(target)) between 1 and 500),
  badge text check (badge is null or char_length(trim(badge)) <= 40),
  sort_order integer not null default 0 check (sort_order >= 0),
  status text not null default 'active' check (status in ('active', 'passive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index storefront_navigation_placement_sort_idx on public.storefront_navigation_items(placement,status,sort_order);

create table public.storefront_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 2 and 160),
  page_type text not null check (page_type in ('information', 'legal', 'support')),
  content text not null check (char_length(trim(content)) between 3 and 100000),
  meta_title text check (meta_title is null or char_length(trim(meta_title)) <= 160),
  meta_description text check (meta_description is null or char_length(trim(meta_description)) <= 500),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index storefront_pages_status_type_idx on public.storefront_pages(status,page_type,updated_at desc);

create trigger storefront_content_blocks_set_updated_at before update on public.storefront_content_blocks
for each row execute function public.set_updated_at();
create trigger storefront_navigation_items_set_updated_at before update on public.storefront_navigation_items
for each row execute function public.set_updated_at();
create trigger storefront_pages_set_updated_at before update on public.storefront_pages
for each row execute function public.set_updated_at();

alter table public.storefront_content_blocks enable row level security;
alter table public.storefront_navigation_items enable row level security;
alter table public.storefront_pages enable row level security;
revoke all on table public.storefront_content_blocks,public.storefront_navigation_items,public.storefront_pages from anon,authenticated;
grant select on table public.storefront_content_blocks,public.storefront_navigation_items,public.storefront_pages to anon,authenticated;
grant select,insert,update,delete on table public.storefront_content_blocks,public.storefront_navigation_items,public.storefront_pages to service_role;

create policy "storefront_content_blocks_public_read" on public.storefront_content_blocks for select to anon,authenticated
using(status='published' and starts_at<=now() and (ends_at is null or ends_at>now()));
create policy "storefront_navigation_public_read" on public.storefront_navigation_items for select to anon,authenticated
using(status='active');
create policy "storefront_pages_public_read" on public.storefront_pages for select to anon,authenticated
using(status='published');

commit;
