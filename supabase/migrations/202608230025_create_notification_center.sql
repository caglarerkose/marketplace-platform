begin;

create table public.user_notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  panel text not null check (panel in ('storefront','seller','admin')),
  notification_type text not null check (char_length(trim(notification_type)) between 2 and 60),
  title text not null check (char_length(trim(title)) between 2 and 160),
  body text not null check (char_length(trim(body)) between 1 and 1000),
  link text check (link is null or char_length(link)<=500), entity_type text, entity_id uuid,
  read_at timestamptz, created_at timestamptz not null default now()
);
create index user_notifications_user_unread_idx on public.user_notifications(user_id,panel,created_at desc) where read_at is null;
create index user_notifications_user_time_idx on public.user_notifications(user_id,created_at desc);

create table public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  panel text not null check (panel in ('storefront','seller','admin')),
  in_app_enabled boolean not null default true, email_enabled boolean not null default true,
  order_updates boolean not null default true, support_updates boolean not null default true,
  campaign_updates boolean not null default true, updated_at timestamptz not null default now(),
  primary key(user_id,panel)
);
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

create or replace function public.mark_notification_read(p_notification_id uuid default null)
returns integer language plpgsql security definer set search_path=public,auth as $$
declare affected integer; current_user_id uuid:=auth.uid();
begin
  if current_user_id is null then raise exception 'authentication_required'; end if;
  update public.user_notifications set read_at=coalesce(read_at,now())
  where user_id=current_user_id and (p_notification_id is null or id=p_notification_id) and read_at is null;
  get diagnostics affected=row_count; return affected;
end;
$$;

create or replace function public.create_user_notification(
  p_user_id uuid,p_panel text,p_type text,p_title text,p_body text,
  p_link text default null,p_entity_type text default null,p_entity_id uuid default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare notification_id uuid;
begin
  if p_user_id is null or p_panel not in ('storefront','seller','admin') then raise exception 'invalid_notification'; end if;
  if exists(select 1 from public.notification_preferences preference where preference.user_id=p_user_id and preference.panel=p_panel and not preference.in_app_enabled) then return null; end if;
  insert into public.user_notifications(user_id,panel,notification_type,title,body,link,entity_type,entity_id)
  values(p_user_id,p_panel,trim(p_type),trim(p_title),trim(p_body),p_link,p_entity_type,p_entity_id)
  returning id into notification_id; return notification_id;
end;
$$;

create or replace function public.notify_support_message_participants()
returns trigger language plpgsql security definer set search_path=public as $$
declare ticket public.support_tickets%rowtype; target_panel text;
begin
  if new.is_internal_note then return new; end if;
  select * into ticket from public.support_tickets where id=new.ticket_id;
  if ticket.requester_user_id<>new.author_user_id then
    target_panel:=case when ticket.requester_type='seller' then 'seller' else 'storefront' end;
    perform public.create_user_notification(ticket.requester_user_id,target_panel,'support_reply','Destek talebiniz yanıtlandı',ticket.ticket_number||' numaralı talebinize yeni yanıt geldi.',case when target_panel='seller' then '/panel' else '/hesabim?tab=support' end,'support_ticket',ticket.id);
  elsif ticket.assigned_admin_user_id is not null then
    perform public.create_user_notification(ticket.assigned_admin_user_id,'admin','support_message','Yeni destek mesajı',ticket.ticket_number||' numaralı talebe yeni mesaj geldi.','/?section=support','support_ticket',ticket.id);
  end if;
  return new;
end;
$$;
create trigger support_messages_create_notification after insert on public.support_messages
for each row execute function public.notify_support_message_participants();

create or replace function public.notify_order_request_decision()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status in ('submitted','under_review') and new.status in ('approved','rejected') then
    perform public.create_user_notification(new.customer_user_id,'storefront','order_request_decision',case when new.status='approved' then 'Talebiniz onaylandı' else 'Talebiniz sonuçlandı' end,(case when new.request_type='return' then 'İade' else 'İptal' end)||' talebiniz '||(case when new.status='approved' then 'onaylandı.' else 'reddedildi.' end),'/hesabim?tab=orders','order_request',new.id);
  end if;
  return new;
end;
$$;
create trigger order_requests_create_decision_notification after update of status on public.order_requests
for each row execute function public.notify_order_request_decision();

alter table public.user_notifications enable row level security;
alter table public.notification_preferences enable row level security;
revoke all on table public.user_notifications,public.notification_preferences from anon,authenticated;
grant select,delete on table public.user_notifications to authenticated;
grant select,insert,update,delete on table public.notification_preferences to authenticated;
grant select,insert,update,delete on table public.user_notifications,public.notification_preferences to service_role;
create policy "user_notifications_own_select" on public.user_notifications for select to authenticated using(user_id=(select auth.uid()));
create policy "user_notifications_own_delete" on public.user_notifications for delete to authenticated using(user_id=(select auth.uid()));
create policy "notification_preferences_own" on public.notification_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

revoke all on function public.mark_notification_read(uuid) from public,anon;
revoke all on function public.create_user_notification(uuid,text,text,text,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated,service_role;
grant execute on function public.create_user_notification(uuid,text,text,text,text,text,text,uuid) to service_role;

commit;
