begin;
create table if not exists public.storefront_seo_settings (
  id boolean primary key default true check (id = true), site_name text not null default 'BişeyEksik',
  contact_phone text, contact_email text, legal_name text, registration_number text, address text,
  meta_title text not null default 'BişeyEksik | Aradığın Her Şey',
  meta_description text not null default 'Güvenli alışveriş ve avantajlı fiyatlar BişeyEksik''te.',
  keywords text[] not null default array['pazaryeri','alışveriş','kampanya'], index_enabled boolean not null default true,
  og_title text not null default 'BişeyEksik', og_description text not null default 'Aradığın her şey burada.',
  search_verification text, updated_by uuid references public.admin_users(user_id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.storefront_seo_settings(id) values(true) on conflict(id) do nothing;
alter table public.storefront_seo_settings enable row level security;
revoke all on table public.storefront_seo_settings from anon, authenticated;
grant select on table public.storefront_seo_settings to anon, authenticated;
grant select, insert, update, delete on table public.storefront_seo_settings to service_role;
drop policy if exists "storefront_seo_public_read" on public.storefront_seo_settings;
create policy "storefront_seo_public_read" on public.storefront_seo_settings for select to anon, authenticated using(id = true);
commit;
