begin;

grant select, insert, update, delete
on table public.profiles
to service_role;

grant select, insert, update, delete
on table public.admin_users
to service_role;

grant select, insert, update, delete
on table public.admin_permissions
to service_role;

grant select, insert, update, delete
on table public.admin_user_permissions
to service_role;

grant select, insert, update, delete
on table public.admin_audit_logs
to service_role;

grant usage, select
on sequence public.admin_audit_logs_id_seq
to service_role;

grant execute
on function public.is_super_admin(uuid)
to service_role;

grant execute
on function public.has_admin_permission(text, uuid)
to service_role;

commit;
