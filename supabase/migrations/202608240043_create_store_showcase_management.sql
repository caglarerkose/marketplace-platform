begin;
create table if not exists public.store_showcase_settings(
 store_id uuid primary key references public.stores(id) on delete cascade,
 banner_url text, mobile_banner_url text, promotion_text text,
 status text not null default 'draft' check(status in('draft','published','passive')),
 updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.store_product_rankings(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id) on delete cascade,
 offer_id uuid not null references public.seller_offers(id) on delete cascade,
 sort_order integer not null check(sort_order between 1 and 1000),label text check(char_length(label)<=40),
 status text not null default 'active' check(status in('active','planned','fixed','passive')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(store_id,offer_id),unique(store_id,sort_order)
);
drop trigger if exists store_showcase_settings_set_updated_at on public.store_showcase_settings;
create trigger store_showcase_settings_set_updated_at before update on public.store_showcase_settings for each row execute function public.set_updated_at();
drop trigger if exists store_product_rankings_set_updated_at on public.store_product_rankings;
create trigger store_product_rankings_set_updated_at before update on public.store_product_rankings for each row execute function public.set_updated_at();
alter table public.store_showcase_settings enable row level security;alter table public.store_product_rankings enable row level security;
revoke all on table public.store_showcase_settings from anon,authenticated;revoke all on table public.store_product_rankings from anon,authenticated;
grant select on table public.store_showcase_settings to anon,authenticated;grant select on table public.store_product_rankings to anon,authenticated;
grant select,insert,update,delete on table public.store_showcase_settings to service_role;grant select,insert,update,delete on table public.store_product_rankings to service_role;
drop policy if exists "published store showcase read" on public.store_showcase_settings;create policy "published store showcase read" on public.store_showcase_settings for select to anon,authenticated using(status='published');
drop policy if exists "active store ranking read" on public.store_product_rankings;create policy "active store ranking read" on public.store_product_rankings for select to anon,authenticated using(status in('active','fixed'));
commit;
