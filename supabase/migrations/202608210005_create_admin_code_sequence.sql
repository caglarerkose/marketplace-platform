begin;

create sequence public.admin_user_code_seq
  as bigint
  start with 1002
  increment by 1
  no cycle;

create or replace function public.next_admin_user_code()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select 'ADM-' || nextval('public.admin_user_code_seq')::text;
$$;

revoke all on function public.next_admin_user_code() from public;
grant execute on function public.next_admin_user_code() to service_role;

commit;
