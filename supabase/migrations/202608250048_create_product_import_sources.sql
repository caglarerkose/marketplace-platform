begin;
create table if not exists public.product_import_sources(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id) on delete cascade,
 name text not null check(char_length(trim(name)) between 2 and 100),source_type text not null check(source_type in('excel','xml','marketplace_api')),
 provider text,endpoint_url text,credential_secret_name text,column_mapping jsonb not null default '{}'::jsonb,
 price_multiplier numeric(8,4) not null default 1 check(price_multiplier>0),stock_threshold integer not null default 0 check(stock_threshold>=0),
 sync_interval_minutes integer check(sync_interval_minutes is null or sync_interval_minutes between 15 and 10080),
 status text not null default 'passive' check(status in('active','passive','error')),last_sync_at timestamptz,last_success_at timestamptz,last_error text,
 created_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(store_id,name)
);
create table if not exists public.product_import_source_runs(
 id uuid primary key default gen_random_uuid(),source_id uuid not null references public.product_import_sources(id) on delete cascade,
 status text not null default 'queued' check(status in('queued','running','completed','failed')),total_rows integer not null default 0,success_rows integer not null default 0,error_rows integer not null default 0,
 error_summary text,started_at timestamptz,completed_at timestamptz,created_at timestamptz not null default now()
);
create index if not exists product_import_sources_store_idx on public.product_import_sources(store_id,status);
create index if not exists product_import_source_runs_source_idx on public.product_import_source_runs(source_id,created_at desc);
drop trigger if exists product_import_sources_set_updated_at on public.product_import_sources;create trigger product_import_sources_set_updated_at before update on public.product_import_sources for each row execute function public.set_updated_at();
alter table public.product_import_sources enable row level security;alter table public.product_import_source_runs enable row level security;
revoke all on table public.product_import_sources,public.product_import_source_runs from anon,authenticated;
grant select on table public.product_import_sources,public.product_import_source_runs to authenticated;
grant select,insert,update,delete on table public.product_import_sources,public.product_import_source_runs to service_role;
create policy "store members read import sources" on public.product_import_sources for select to authenticated using(exists(select 1 from public.store_members m where m.store_id=store_id and m.user_id=(select auth.uid()) and m.status='active'));
create policy "store members read import runs" on public.product_import_source_runs for select to authenticated using(exists(select 1 from public.product_import_sources s join public.store_members m on m.store_id=s.store_id where s.id=source_id and m.user_id=(select auth.uid()) and m.status='active'));
commit;
