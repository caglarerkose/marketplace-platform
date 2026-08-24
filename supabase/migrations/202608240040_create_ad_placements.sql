begin;
create table if not exists public.ad_placements(
 id uuid primary key default gen_random_uuid(),title text not null check(char_length(trim(title)) between 2 and 160),
 placement text not null check(placement in('home_promo','category_list','product_detail','storefront')),
 sponsor_name text not null check(char_length(trim(sponsor_name)) between 2 and 160),target text not null check(char_length(trim(target)) between 1 and 500),
 label text not null default 'SPONSORLU' check(label in('SPONSORLU','REKLAM','FIRSAT','ÖNE ÇIKAN')),
 theme text not null default 'orange' check(theme in('orange','dark','blue','green')),body text not null check(char_length(trim(body)) between 3 and 500),
 starts_at timestamptz not null,ends_at timestamptz not null,status text not null default 'scheduled' check(status in('active','scheduled','passive')),
 created_by uuid references public.admin_users(user_id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(ends_at>starts_at)
);
create index if not exists ad_placements_public_idx on public.ad_placements(placement,status,starts_at,ends_at);
drop trigger if exists ad_placements_set_updated_at on public.ad_placements;create trigger ad_placements_set_updated_at before update on public.ad_placements for each row execute function public.set_updated_at();
alter table public.ad_placements enable row level security;revoke all on table public.ad_placements from anon,authenticated;
grant select on table public.ad_placements to anon,authenticated;grant select,insert,update,delete on table public.ad_placements to service_role;
drop policy if exists "ad_placements_public_read" on public.ad_placements;
create policy "ad_placements_public_read" on public.ad_placements for select to anon,authenticated using(status='active' and starts_at<=now() and ends_at>now());
commit;
