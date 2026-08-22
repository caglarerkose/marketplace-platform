begin;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_url text,
  sort_order integer not null default 0 check (sort_order >= 0),
  status text not null default 'active'
    check (status in ('active', 'passive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

create unique index categories_parent_name_unique_idx
  on public.categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create index categories_parent_sort_idx
  on public.categories (parent_id, sort_order, name);
create index categories_status_idx
  on public.categories (status);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  logo_url text,
  website_url text,
  status text not null default 'active'
    check (status in ('active', 'passive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index brands_name_unique_idx on public.brands (lower(name));
create index brands_status_name_idx on public.brands (status, name);

create table public.category_attributes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  code text not null check (code ~ '^[a-z][a-z0-9_]*$'),
  data_type text not null
    check (data_type in ('text', 'number', 'boolean', 'select', 'multiselect')),
  is_required boolean not null default false,
  is_filterable boolean not null default false,
  is_variant_axis boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  status text not null default 'active'
    check (status in ('active', 'passive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, code)
);

create index category_attributes_category_sort_idx
  on public.category_attributes (category_id, sort_order, name);

create table public.category_attribute_options (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.category_attributes(id) on delete cascade,
  value text not null check (char_length(trim(value)) between 1 and 120),
  label text not null check (char_length(trim(label)) between 1 and 120),
  sort_order integer not null default 0 check (sort_order >= 0),
  status text not null default 'active'
    check (status in ('active', 'passive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attribute_id, value)
);

create index category_attribute_options_attribute_sort_idx
  on public.category_attribute_options (attribute_id, sort_order, label);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create trigger category_attributes_set_updated_at
before update on public.category_attributes
for each row execute function public.set_updated_at();

create trigger category_attribute_options_set_updated_at
before update on public.category_attribute_options
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.category_attributes enable row level security;
alter table public.category_attribute_options enable row level security;

revoke all on table public.categories from anon, authenticated;
revoke all on table public.brands from anon, authenticated;
revoke all on table public.category_attributes from anon, authenticated;
revoke all on table public.category_attribute_options from anon, authenticated;

grant select on table public.categories to anon, authenticated;
grant select on table public.brands to anon, authenticated;
grant select on table public.category_attributes to anon, authenticated;
grant select on table public.category_attribute_options to anon, authenticated;

grant select, insert, update, delete on table public.categories to service_role;
grant select, insert, update, delete on table public.brands to service_role;
grant select, insert, update, delete on table public.category_attributes to service_role;
grant select, insert, update, delete on table public.category_attribute_options to service_role;

create policy "categories_read_active"
on public.categories for select
to anon, authenticated
using (status = 'active');

create policy "brands_read_active"
on public.brands for select
to anon, authenticated
using (status = 'active');

create policy "category_attributes_read_active"
on public.category_attributes for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.categories category
    where category.id = category_id
      and category.status = 'active'
  )
);

create policy "category_attribute_options_read_active"
on public.category_attribute_options for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.category_attributes attribute
    join public.categories category on category.id = attribute.category_id
    where attribute.id = attribute_id
      and attribute.status = 'active'
      and category.status = 'active'
  )
);

commit;
