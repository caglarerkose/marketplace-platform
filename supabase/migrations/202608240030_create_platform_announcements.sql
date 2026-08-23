begin;

create table public.platform_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 160),
  body text not null check (char_length(trim(body)) between 3 and 5000),
  audience text not null check (audience in ('all', 'storefront', 'seller', 'admin')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  link text check (link is null or char_length(trim(link)) <= 500),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'paused', 'ended')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index platform_announcements_publication_idx
  on public.platform_announcements(status, audience, starts_at desc, ends_at);

create table public.announcement_reads (
  announcement_id uuid not null references public.platform_announcements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key(announcement_id, user_id)
);

create index announcement_reads_user_time_idx on public.announcement_reads(user_id, read_at desc);

create trigger platform_announcements_set_updated_at before update on public.platform_announcements
for each row execute function public.set_updated_at();

create or replace function public.mark_announcement_read(p_announcement_id uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
declare user_id uuid := auth.uid();
begin
  if user_id is null then raise exception 'authentication_required'; end if;
  if not exists(
    select 1 from public.platform_announcements announcement
    where announcement.id = p_announcement_id and announcement.status = 'published'
      and announcement.starts_at <= now() and (announcement.ends_at is null or announcement.ends_at > now())
  ) then raise exception 'announcement_not_available'; end if;
  insert into public.announcement_reads(announcement_id,user_id) values(p_announcement_id,user_id)
  on conflict(announcement_id,user_id) do update set read_at=excluded.read_at;
end;
$$;

alter table public.platform_announcements enable row level security;
alter table public.announcement_reads enable row level security;
revoke all on table public.platform_announcements,public.announcement_reads from anon,authenticated;
grant select on table public.platform_announcements to anon,authenticated;
grant select on table public.announcement_reads to authenticated;
grant select,insert,update,delete on table public.platform_announcements,public.announcement_reads to service_role;

create policy "announcements_public_read" on public.platform_announcements for select to anon,authenticated
using(audience in ('all','storefront') and status='published' and starts_at<=now() and (ends_at is null or ends_at>now()));
create policy "announcement_reads_own_read" on public.announcement_reads for select to authenticated
using(user_id=(select auth.uid()));

revoke all on function public.mark_announcement_read(uuid) from public,anon;
grant execute on function public.mark_announcement_read(uuid) to authenticated,service_role;

commit;
