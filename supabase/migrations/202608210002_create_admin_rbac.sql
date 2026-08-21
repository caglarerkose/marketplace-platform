begin;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  user_code text not null unique
    check (user_code ~ '^(SUPER|ADM)-[0-9]{3,}$'),
  is_super_admin boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'passive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_permissions (
  code text primary key,
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

insert into public.admin_permissions (code, name, description)
values
  ('view', 'Görüntüleme', 'Admin paneli verilerini salt okunur görüntüleme'),
  ('support', 'Destek', 'Müşteri ve satıcı destek taleplerini yönetme'),
  ('product_approval', 'Ürün Onay', 'Ürünleri inceleme, onaylama ve revizeye gönderme');

create table public.admin_user_permissions (
  user_id uuid not null references public.admin_users(user_id) on delete cascade,
  permission_code text not null references public.admin_permissions(code) on delete restrict,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, permission_code)
);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_user_code text,
  action text not null,
  module text not null,
  entity_type text,
  entity_id text,
  risk text not null default 'info'
    check (risk in ('info', 'warning', 'critical')),
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_actor_idx
  on public.admin_audit_logs (actor_user_id, created_at desc);
create index admin_audit_logs_module_idx
  on public.admin_audit_logs (module, created_at desc);

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

create or replace function public.is_super_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = check_user_id
      and is_super_admin = true
      and status = 'active'
  );
$$;

create or replace function public.has_admin_permission(
  requested_permission text,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_super_admin(check_user_id) or exists (
    select 1
    from public.admin_users au
    join public.admin_user_permissions aup on aup.user_id = au.user_id
    where au.user_id = check_user_id
      and au.status = 'active'
      and aup.permission_code = requested_permission
  );
$$;

alter table public.admin_users enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_user_permissions enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all on public.admin_users from anon, authenticated;
revoke all on public.admin_permissions from anon, authenticated;
revoke all on public.admin_user_permissions from anon, authenticated;
revoke all on public.admin_audit_logs from anon, authenticated;

grant select on public.admin_users to authenticated;
grant select on public.admin_permissions to authenticated;
grant select on public.admin_user_permissions to authenticated;
grant select on public.admin_audit_logs to authenticated;

create policy "admin_users_select_authorized"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()) or public.is_super_admin());

create policy "admin_permissions_select_admins"
on public.admin_permissions for select to authenticated
using (public.has_admin_permission('view'));

create policy "admin_user_permissions_select_authorized"
on public.admin_user_permissions for select to authenticated
using (user_id = (select auth.uid()) or public.is_super_admin());

create policy "admin_audit_logs_select_super_admin"
on public.admin_audit_logs for select to authenticated
using (public.is_super_admin());

revoke all on function public.is_super_admin(uuid) from public;
revoke all on function public.has_admin_permission(text, uuid) from public;
grant execute on function public.is_super_admin(uuid) to authenticated;
grant execute on function public.has_admin_permission(text, uuid) to authenticated;

commit;
