begin;

create sequence public.support_ticket_number_seq start with 10001;

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('DST-' || lpad(nextval('public.support_ticket_number_seq')::text, 6, '0')),
  requester_user_id uuid not null references auth.users(id) on delete restrict,
  requester_type text not null check (requester_type in ('customer', 'seller', 'admin')),
  store_id uuid references public.stores(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  category text not null check (category in ('order', 'product', 'account', 'seller_application', 'payment', 'return', 'other')),
  subject text not null check (char_length(trim(subject)) between 3 and 160),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'waiting_customer', 'waiting_support', 'resolved', 'closed')),
  assigned_admin_user_id uuid references auth.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_requester_time_idx on public.support_tickets(requester_user_id, last_message_at desc);
create index support_tickets_store_status_idx on public.support_tickets(store_id, status, last_message_at desc);
create index support_tickets_admin_queue_idx on public.support_tickets(status, priority, last_message_at desc);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  author_type text not null check (author_type in ('customer', 'seller', 'admin')),
  body text not null check (char_length(trim(body)) between 1 and 5000),
  attachment_urls jsonb not null default '[]'::jsonb check (jsonb_typeof(attachment_urls) = 'array'),
  is_internal_note boolean not null default false,
  created_at timestamptz not null default now()
);

create index support_messages_ticket_time_idx on public.support_messages(ticket_id, created_at);
create trigger support_tickets_set_updated_at before update on public.support_tickets
for each row execute function public.set_updated_at();

create or replace function public.can_access_support_ticket(p_ticket_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.support_tickets ticket
    where ticket.id = p_ticket_id and (
      ticket.requester_user_id = p_user_id
      or exists (select 1 from public.admin_users admin_user where admin_user.user_id = p_user_id and admin_user.status = 'active')
      or exists (select 1 from public.store_members member where member.store_id = ticket.store_id and member.user_id = p_user_id and member.status = 'active')
    )
  );
$$;

create or replace function public.create_support_ticket(
  p_requester_type text, p_store_id uuid, p_order_id uuid,
  p_category text, p_subject text, p_message text
)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare user_id uuid := auth.uid(); ticket_id uuid;
begin
  if user_id is null then raise exception 'authentication_required'; end if;
  if p_requester_type not in ('customer', 'seller', 'admin') then raise exception 'invalid_requester_type'; end if;
  if char_length(trim(coalesce(p_subject, ''))) < 3 or char_length(trim(coalesce(p_message, ''))) < 1 then raise exception 'ticket_content_required'; end if;
  if p_requester_type = 'admin' and not exists (select 1 from public.admin_users where admin_users.user_id = user_id and status = 'active') then raise exception 'admin_access_denied'; end if;
  if p_requester_type = 'seller' and (p_store_id is null or not exists (select 1 from public.store_members where store_id = p_store_id and store_members.user_id = user_id and status = 'active')) then raise exception 'store_access_denied'; end if;
  if p_requester_type = 'customer' and p_order_id is not null and not exists (select 1 from public.orders where id = p_order_id and customer_user_id = user_id) then raise exception 'order_access_denied'; end if;
  if p_requester_type = 'customer' and p_store_id is not null and (
    p_order_id is null or not exists (
      select 1 from public.order_items item
      join public.orders customer_order on customer_order.id = item.order_id
      where item.store_id = p_store_id and item.order_id = p_order_id
        and customer_order.customer_user_id = user_id
    )
  ) then raise exception 'store_access_denied'; end if;
  insert into public.support_tickets(requester_user_id,requester_type,store_id,order_id,category,subject)
  values(user_id,p_requester_type,p_store_id,p_order_id,p_category,trim(p_subject)) returning id into ticket_id;
  insert into public.support_messages(ticket_id,author_user_id,author_type,body)
  values(ticket_id,user_id,p_requester_type,trim(p_message));
  return ticket_id;
end;
$$;

create or replace function public.add_support_message(
  p_ticket_id uuid, p_author_type text, p_body text, p_internal_note boolean default false
)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare user_id uuid := auth.uid(); message_id uuid; ticket_status text;
begin
  if user_id is null or not public.can_access_support_ticket(p_ticket_id,user_id) then raise exception 'ticket_access_denied'; end if;
  if p_author_type not in ('customer','seller','admin') or char_length(trim(coalesce(p_body,''))) < 1 then raise exception 'invalid_message'; end if;
  if p_author_type = 'admin' and not exists (select 1 from public.admin_users where admin_users.user_id=user_id and status='active') then raise exception 'author_type_access_denied'; end if;
  if p_author_type = 'seller' and not exists (
    select 1 from public.support_tickets ticket
    join public.store_members member on member.store_id=ticket.store_id
    where ticket.id=p_ticket_id and member.user_id=user_id and member.status='active'
  ) then raise exception 'author_type_access_denied'; end if;
  if p_author_type = 'customer' and not exists (select 1 from public.support_tickets where id=p_ticket_id and requester_user_id=user_id) then raise exception 'author_type_access_denied'; end if;
  if p_internal_note and not exists (select 1 from public.admin_users where admin_users.user_id=user_id and status='active') then raise exception 'internal_note_access_denied'; end if;
  select status into ticket_status from public.support_tickets where id=p_ticket_id for update;
  if ticket_status='closed' then raise exception 'ticket_closed'; end if;
  insert into public.support_messages(ticket_id,author_user_id,author_type,body,is_internal_note)
  values(p_ticket_id,user_id,p_author_type,trim(p_body),p_internal_note) returning id into message_id;
  update public.support_tickets set last_message_at=now(),status=case when p_author_type='admin' then 'waiting_customer' else 'waiting_support' end where id=p_ticket_id;
  return message_id;
end;
$$;

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
revoke all on table public.support_tickets,public.support_messages from anon,authenticated;
grant select on table public.support_tickets,public.support_messages to authenticated;
grant select,insert,update,delete on table public.support_tickets,public.support_messages to service_role;
grant usage,select on sequence public.support_ticket_number_seq to service_role;

create policy "support_tickets_participant_select" on public.support_tickets for select to authenticated
using (public.can_access_support_ticket(id,(select auth.uid())));
create policy "support_messages_participant_select" on public.support_messages for select to authenticated
using (public.can_access_support_ticket(ticket_id,(select auth.uid())) and (not is_internal_note or exists(select 1 from public.admin_users where user_id=(select auth.uid()) and status='active')));

revoke all on function public.can_access_support_ticket(uuid,uuid) from public,anon;
revoke all on function public.create_support_ticket(text,uuid,uuid,text,text,text) from public,anon;
revoke all on function public.add_support_message(uuid,text,text,boolean) from public,anon;
grant execute on function public.can_access_support_ticket(uuid,uuid) to authenticated,service_role;
grant execute on function public.create_support_ticket(text,uuid,uuid,text,text,text) to authenticated,service_role;
grant execute on function public.add_support_message(uuid,text,text,boolean) to authenticated,service_role;

commit;
