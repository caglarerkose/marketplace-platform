begin;
create table if not exists public.product_import_jobs(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id) on delete cascade,
 actor_user_id uuid references auth.users(id) on delete set null,source_type text not null default 'csv' check(source_type in('csv')),
 original_file_name text not null,status text not null default 'validating' check(status in('validating','needs_review','processing','completed','rejected','failed')),
 total_rows integer not null default 0,valid_rows integer not null default 0,error_rows integer not null default 0,
 admin_note text,reviewed_by uuid references public.admin_users(user_id) on delete set null,reviewed_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.product_import_rows(
 id bigint generated always as identity primary key,job_id uuid not null references public.product_import_jobs(id) on delete cascade,
 row_number integer not null,raw_data jsonb not null default '{}'::jsonb,category_id uuid references public.categories(id) on delete set null,
 validation_status text not null check(validation_status in('valid','error','imported')),
 validation_errors text[] not null default '{}',product_id uuid references public.catalog_products(id) on delete set null,
 offer_id uuid references public.seller_offers(id) on delete set null,created_at timestamptz not null default now(),unique(job_id,row_number)
);
create index if not exists product_import_jobs_store_time_idx on public.product_import_jobs(store_id,created_at desc);
create index if not exists product_import_jobs_status_idx on public.product_import_jobs(status,created_at);
create index if not exists product_import_rows_job_status_idx on public.product_import_rows(job_id,validation_status,row_number);
drop trigger if exists product_import_jobs_set_updated_at on public.product_import_jobs;
create trigger product_import_jobs_set_updated_at before update on public.product_import_jobs for each row execute function public.set_updated_at();
alter table public.product_import_jobs enable row level security;alter table public.product_import_rows enable row level security;
revoke all on table public.product_import_jobs,public.product_import_rows from anon,authenticated;
grant select,insert,update,delete on table public.product_import_jobs,public.product_import_rows to service_role;
commit;
