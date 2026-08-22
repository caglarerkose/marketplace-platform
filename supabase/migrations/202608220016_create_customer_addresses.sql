begin;

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 60),
  recipient_name text not null check (char_length(trim(recipient_name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 10 and 30),
  city text not null check (char_length(trim(city)) between 2 and 80),
  district text not null check (char_length(trim(district)) between 2 and 80),
  neighborhood text check (neighborhood is null or char_length(trim(neighborhood)) between 2 and 120),
  address_line text not null check (char_length(trim(address_line)) between 10 and 500),
  postal_code text check (postal_code is null or char_length(trim(postal_code)) between 3 and 20),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_addresses_user_idx on public.customer_addresses(user_id, created_at desc);
create unique index customer_addresses_single_default_idx on public.customer_addresses(user_id) where is_default = true;
create trigger customer_addresses_set_updated_at before update on public.customer_addresses
for each row execute function public.set_updated_at();

alter table public.customer_addresses enable row level security;
revoke all on table public.customer_addresses from anon, authenticated;
grant select, insert, update, delete on table public.customer_addresses to authenticated;

create policy "customer_addresses_select_own" on public.customer_addresses for select to authenticated
using ((select auth.uid()) = user_id);
create policy "customer_addresses_insert_own" on public.customer_addresses for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "customer_addresses_update_own" on public.customer_addresses for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "customer_addresses_delete_own" on public.customer_addresses for delete to authenticated
using ((select auth.uid()) = user_id);

commit;
