begin;
create table if not exists public.seller_user_preferences(
 user_id uuid primary key references auth.users(id) on delete cascade,
 order_notification text not null default 'panel_email' check(order_notification in('panel_email','panel')),
 critical_stock_enabled boolean not null default true,campaign_invitation_enabled boolean not null default true,
 finance_notification text not null default 'panel_email' check(finance_notification in('panel_email','panel')),
 updated_at timestamptz not null default now()
);
drop trigger if exists seller_user_preferences_set_updated_at on public.seller_user_preferences;
create trigger seller_user_preferences_set_updated_at before update on public.seller_user_preferences for each row execute function public.set_updated_at();
alter table public.seller_user_preferences enable row level security;revoke all on table public.seller_user_preferences from anon,authenticated;
grant select,insert,update on table public.seller_user_preferences to authenticated;grant select,insert,update,delete on table public.seller_user_preferences to service_role;
drop policy if exists "seller preferences own read" on public.seller_user_preferences;create policy "seller preferences own read" on public.seller_user_preferences for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "seller preferences own insert" on public.seller_user_preferences;create policy "seller preferences own insert" on public.seller_user_preferences for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists "seller preferences own update" on public.seller_user_preferences;create policy "seller preferences own update" on public.seller_user_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
commit;
