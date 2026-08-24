begin;
create table if not exists public.catalog_ranking_rules(
 id uuid primary key default gen_random_uuid(),placement text not null check(placement in('home','category','search')),
 category_id uuid references public.categories(id) on delete cascade,product_id uuid not null references public.catalog_products(id) on delete cascade,
 rule_type text not null default 'pin' check(rule_type in('pin','manual')),
 priority integer not null default 1 check(priority between 1 and 10000),mobile_visible boolean not null default true,
 status text not null default 'active' check(status in('active','passive')),admin_note text,
 created_by uuid references public.admin_users(user_id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists catalog_ranking_rules_lookup_idx on public.catalog_ranking_rules(placement,category_id,status,priority);
create unique index if not exists catalog_ranking_rules_scope_product_idx on public.catalog_ranking_rules(placement,category_id,product_id) nulls not distinct;
drop trigger if exists catalog_ranking_rules_set_updated_at on public.catalog_ranking_rules;
create trigger catalog_ranking_rules_set_updated_at before update on public.catalog_ranking_rules for each row execute function public.set_updated_at();
alter table public.catalog_ranking_rules enable row level security;
revoke all on table public.catalog_ranking_rules from anon,authenticated;
grant select on table public.catalog_ranking_rules to anon,authenticated;
grant select,insert,update,delete on table public.catalog_ranking_rules to service_role;
drop policy if exists "catalog_ranking_rules_public_read" on public.catalog_ranking_rules;
create policy "catalog_ranking_rules_public_read" on public.catalog_ranking_rules for select to anon,authenticated using(status='active');
commit;
