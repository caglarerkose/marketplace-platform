begin;

do $$
declare
  auth_user_count integer;
  first_user_id uuid;
begin
  select count(*) into auth_user_count from auth.users;

  if auth_user_count <> 1 then
    raise exception
      'Super Admin bootstrap requires exactly one Auth user; found %',
      auth_user_count;
  end if;

  select id into first_user_id
  from auth.users
  order by created_at asc
  limit 1;

  insert into public.admin_users (
    user_id,
    user_code,
    is_super_admin,
    status,
    created_by
  )
  values (
    first_user_id,
    'SUPER-001',
    true,
    'active',
    first_user_id
  );

  insert into public.admin_audit_logs (
    actor_user_id,
    actor_user_code,
    action,
    module,
    entity_type,
    entity_id,
    risk,
    details
  )
  values (
    first_user_id,
    'SUPER-001',
    'İlk Super Admin hesabı oluşturuldu',
    'Kullanıcı Yönetimi',
    'admin_user',
    first_user_id::text,
    'critical',
    jsonb_build_object('bootstrap', true)
  );
end;
$$;

commit;
