begin;

create or replace function public.manage_support_ticket(
  p_ticket_id uuid,
  p_actor_user_id uuid,
  p_action text,
  p_priority text default null,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_record public.support_tickets%rowtype;
  next_status text;
  actor_code text;
begin
  select admin_user.user_code into actor_code
  from public.admin_users admin_user
  where admin_user.user_id = p_actor_user_id
    and admin_user.status = 'active'
    and (
      admin_user.is_super_admin
      or exists (
        select 1 from public.admin_user_permissions permission
        where permission.user_id = admin_user.user_id
          and permission.permission_code = 'support'
      )
    );
  if actor_code is null then raise exception 'support_management_access_denied'; end if;

  select * into ticket_record from public.support_tickets
  where id = p_ticket_id for update;
  if not found then raise exception 'ticket_not_found'; end if;
  if p_action not in ('assign_self', 'set_priority', 'resolve', 'close', 'reopen') then
    raise exception 'invalid_ticket_action';
  end if;

  if p_action = 'assign_self' then
    update public.support_tickets set assigned_admin_user_id = p_actor_user_id
    where id = p_ticket_id;
  elsif p_action = 'set_priority' then
    if p_priority not in ('low', 'normal', 'high', 'urgent') then raise exception 'invalid_priority'; end if;
    update public.support_tickets set priority = p_priority where id = p_ticket_id;
  elsif p_action = 'resolve' then
    if char_length(trim(coalesce(p_note, ''))) < 3 then raise exception 'resolution_note_required'; end if;
    update public.support_tickets
    set status = 'resolved', resolved_at = now(), assigned_admin_user_id = coalesce(assigned_admin_user_id, p_actor_user_id)
    where id = p_ticket_id;
  elsif p_action = 'close' then
    if ticket_record.status <> 'resolved' then raise exception 'ticket_must_be_resolved'; end if;
    update public.support_tickets set status = 'closed', closed_at = now() where id = p_ticket_id;
  else
    update public.support_tickets
    set status = 'open', resolved_at = null, closed_at = null,
        assigned_admin_user_id = coalesce(assigned_admin_user_id, p_actor_user_id)
    where id = p_ticket_id;
  end if;

  select status into next_status from public.support_tickets where id = p_ticket_id;
  if nullif(trim(coalesce(p_note, '')), '') is not null then
    insert into public.support_messages (
      ticket_id, author_user_id, author_type, body, is_internal_note
    ) values (
      p_ticket_id, p_actor_user_id, 'admin', trim(p_note), true
    );
    update public.support_tickets set last_message_at = now() where id = p_ticket_id;
  end if;

  insert into public.admin_audit_logs (
    actor_user_id, actor_user_code, action, module,
    entity_type, entity_id, risk, details
  ) values (
    p_actor_user_id, actor_code, 'Destek talebi yönetildi', 'Destek Talepleri',
    'support_ticket', p_ticket_id, 'info',
    jsonb_build_object('action', p_action, 'priority', p_priority, 'status', next_status)
  );

  return next_status;
end;
$$;

revoke all on function public.manage_support_ticket(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.manage_support_ticket(uuid,uuid,text,text,text) to service_role;

commit;
