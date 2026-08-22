begin;

create table public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null references auth.users(id) on delete restrict,
  business_type text not null check (business_type in ('individual', 'sole_proprietorship', 'limited', 'corporation')),
  legal_name text not null check (char_length(trim(legal_name)) between 2 and 180),
  tax_number text check (tax_number is null or char_length(trim(tax_number)) between 10 and 11),
  store_name text not null check (char_length(trim(store_name)) between 2 and 120),
  contact_email text not null,
  contact_phone text,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'under_review', 'revision_requested', 'approved', 'rejected')),
  admin_note text,
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seller_applications_applicant_idx
  on public.seller_applications (applicant_user_id, created_at desc);
create index seller_applications_status_idx
  on public.seller_applications (status, created_at);

create unique index seller_applications_open_user_idx
  on public.seller_applications (applicant_user_id)
  where status in ('draft', 'submitted', 'under_review', 'revision_requested');

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete restrict,
  approved_application_id uuid unique references public.seller_applications(id) on delete restrict,
  legal_name text not null check (char_length(trim(legal_name)) between 2 and 180),
  tax_number text unique,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sellers_status_idx on public.sellers (status);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  logo_url text,
  banner_url text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'passive', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index stores_seller_name_unique_idx on public.stores (seller_id, lower(name));
create index stores_seller_status_idx on public.stores (seller_id, status);

create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'catalog', 'orders', 'finance', 'support')),
  status text not null default 'active' check (status in ('active', 'passive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create unique index store_members_single_owner_idx
  on public.store_members (store_id)
  where role = 'owner';
create index store_members_user_status_idx on public.store_members (user_id, status);

create trigger seller_applications_set_updated_at
before update on public.seller_applications
for each row execute function public.set_updated_at();

create trigger sellers_set_updated_at
before update on public.sellers
for each row execute function public.set_updated_at();

create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

create trigger store_members_set_updated_at
before update on public.store_members
for each row execute function public.set_updated_at();

alter table public.seller_applications enable row level security;
alter table public.sellers enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;

revoke all on table public.seller_applications from anon, authenticated;
revoke all on table public.sellers from anon, authenticated;
revoke all on table public.stores from anon, authenticated;
revoke all on table public.store_members from anon, authenticated;

grant select, insert, update on table public.seller_applications to authenticated;
grant select on table public.sellers to authenticated;
grant select on table public.stores to anon, authenticated;
grant select on table public.store_members to authenticated;

grant select, insert, update, delete on table public.seller_applications to service_role;
grant select, insert, update, delete on table public.sellers to service_role;
grant select, insert, update, delete on table public.stores to service_role;
grant select, insert, update, delete on table public.store_members to service_role;

create policy "seller_applications_select_own"
on public.seller_applications for select
to authenticated
using ((select auth.uid()) = applicant_user_id);

create policy "seller_applications_insert_own"
on public.seller_applications for insert
to authenticated
with check (
  (select auth.uid()) = applicant_user_id
  and status = 'draft'
  and reviewed_by is null
  and reviewed_at is null
);

create policy "seller_applications_update_own_draft"
on public.seller_applications for update
to authenticated
using (
  (select auth.uid()) = applicant_user_id
  and status in ('draft', 'revision_requested')
)
with check (
  (select auth.uid()) = applicant_user_id
  and status in ('draft', 'submitted')
  and reviewed_by is null
  and reviewed_at is null
);

create policy "sellers_select_owner"
on public.sellers for select
to authenticated
using ((select auth.uid()) = owner_user_id);

create policy "stores_read_active"
on public.stores for select
to anon, authenticated
using (status = 'active');

create policy "store_members_select_own"
on public.store_members for select
to authenticated
using ((select auth.uid()) = user_id);

commit;
