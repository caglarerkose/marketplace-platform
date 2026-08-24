begin;

create table if not exists public.installment_rules (
  id uuid primary key default gen_random_uuid(),
  category_name text not null,
  max_installments integer not null check (max_installments in (1, 3, 6, 9, 12)),
  fee_mode text not null default 'none' check (fee_mode in ('none', 'rate')),
  fee_rate numeric(6,2) not null default 0 check (fee_rate >= 0 and fee_rate <= 100),
  minimum_cart_total numeric(12,2) not null default 0 check (minimum_cart_total >= 0),
  status text not null default 'active' check (status in ('active', 'passive', 'limited')),
  seller_note text,
  published_at timestamptz,
  created_by uuid references public.admin_users(user_id) on delete set null,
  updated_by uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists installment_rules_category_unique
  on public.installment_rules (lower(trim(category_name)));
create index if not exists installment_rules_public_idx
  on public.installment_rules (status, published_at);

create table if not exists public.installment_information_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_name text not null,
  note text not null check (char_length(trim(note)) between 3 and 1000),
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'rejected')),
  admin_note text,
  resolved_by uuid references public.admin_users(user_id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists installment_requests_store_idx
  on public.installment_information_requests (store_id, created_at desc);
create index if not exists installment_requests_status_idx
  on public.installment_information_requests (status, created_at desc);

drop trigger if exists installment_rules_set_updated_at on public.installment_rules;
create trigger installment_rules_set_updated_at before update on public.installment_rules
for each row execute function public.set_updated_at();
drop trigger if exists installment_requests_set_updated_at on public.installment_information_requests;
create trigger installment_requests_set_updated_at before update on public.installment_information_requests
for each row execute function public.set_updated_at();

alter table public.installment_rules enable row level security;
alter table public.installment_information_requests enable row level security;
revoke all on table public.installment_rules from anon, authenticated;
revoke all on table public.installment_information_requests from anon, authenticated;
grant select on table public.installment_rules to anon, authenticated;
grant select, insert on table public.installment_information_requests to authenticated;
grant select, insert, update, delete on table public.installment_rules to service_role;
grant select, insert, update, delete on table public.installment_information_requests to service_role;

drop policy if exists "published installment rules are readable" on public.installment_rules;
create policy "published installment rules are readable" on public.installment_rules
for select to anon, authenticated using (published_at is not null and status in ('active', 'limited'));

drop policy if exists "store members read installment requests" on public.installment_information_requests;
create policy "store members read installment requests" on public.installment_information_requests
for select to authenticated using (exists (
  select 1 from public.store_members sm
  where sm.store_id = store_id and sm.user_id = auth.uid() and sm.status = 'active'
));
drop policy if exists "store members create installment requests" on public.installment_information_requests;
create policy "store members create installment requests" on public.installment_information_requests
for insert to authenticated with check (exists (
  select 1 from public.store_members sm
  where sm.store_id = store_id and sm.user_id = auth.uid() and sm.status = 'active'
));

commit;
