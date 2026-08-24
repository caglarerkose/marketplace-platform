begin;
create table if not exists public.mobile_storefront_settings(
 id boolean primary key default true check(id=true),app_mode text not null default 'pwa' check(app_mode in('pwa','hybrid','mobile_web')),
 category_view text not null default 'square_grid' check(category_view in('square_grid','horizontal_list','compact_list')),
 product_card_view text not null default 'marketplace' check(product_card_view in('compact','marketplace','image_first')),
 purchase_bar_enabled boolean not null default true,campaign_banner_enabled boolean not null default true,push_enabled boolean not null default false,
 home_block_order text[] not null default array['slider','campaign','approved_products','advertisement','products'],mobile_message text,
 navigation_items jsonb not null default '[{"label":"Anasayfa","target":"/","icon":"fa-house","sortOrder":1,"enabled":true},{"label":"Kategoriler","target":"/kategoriler","icon":"fa-magnifying-glass","sortOrder":2,"enabled":true},{"label":"Favorilerim","target":"/favoriler","icon":"fa-heart","sortOrder":3,"enabled":true},{"label":"Sepetim","target":"/sepet","icon":"fa-cart-shopping","sortOrder":4,"enabled":true},{"label":"Hesabım","target":"/hesabim","icon":"fa-user","sortOrder":5,"enabled":true}]'::jsonb check(jsonb_typeof(navigation_items)='array'),
 updated_by uuid references public.admin_users(user_id) on delete set null,updated_at timestamptz not null default now()
);
insert into public.mobile_storefront_settings(id)values(true)on conflict(id)do nothing;
alter table public.mobile_storefront_settings enable row level security;revoke all on table public.mobile_storefront_settings from anon,authenticated;
grant select on table public.mobile_storefront_settings to anon,authenticated;grant select,insert,update,delete on table public.mobile_storefront_settings to service_role;
drop policy if exists "mobile_storefront_settings_public_read" on public.mobile_storefront_settings;
create policy "mobile_storefront_settings_public_read" on public.mobile_storefront_settings for select to anon,authenticated using(id=true);
commit;
