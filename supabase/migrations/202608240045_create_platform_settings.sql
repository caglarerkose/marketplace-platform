begin;
create table if not exists public.platform_settings(
 id boolean primary key default true check(id),platform_name text not null default 'BişeyEksik',favicon_path text not null default '/favicon.ico',
 default_currency text not null default 'TRY' check(default_currency in('TRY','USD','EUR')),support_email text,support_phone text,
 legal_name text,tax_number text,address text,maintenance_mode boolean not null default false,
 email_notifications boolean not null default true,panel_notifications boolean not null default true,push_notifications boolean not null default false,
 updated_by uuid references public.admin_users(user_id) on delete set null,updated_at timestamptz not null default now()
);
insert into public.platform_settings(id) values(true) on conflict(id) do nothing;
alter table public.platform_settings enable row level security;revoke all on table public.platform_settings from anon,authenticated;
grant select on table public.platform_settings to anon,authenticated;grant select,insert,update on table public.platform_settings to service_role;
drop policy if exists "public platform settings read" on public.platform_settings;create policy "public platform settings read" on public.platform_settings for select to anon,authenticated using(true);
commit;
