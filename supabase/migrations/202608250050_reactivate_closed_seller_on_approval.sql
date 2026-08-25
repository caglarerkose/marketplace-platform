begin;

create or replace function public.approve_seller_application(
  p_application_id uuid,
  p_reviewer_id uuid,
  p_store_slug text,
  p_admin_note text default null
)
returns table (seller_id uuid, store_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  application public.seller_applications%rowtype;
  existing_seller public.sellers%rowtype;
  created_seller_id uuid;
  created_store_id uuid;
begin
  if p_store_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid_store_slug';
  end if;

  select * into application
  from public.seller_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'application_not_found';
  end if;
  if application.status not in ('submitted', 'under_review', 'revision_requested') then
    raise exception 'application_not_reviewable';
  end if;
  if application.applicant_user_id is null then
    raise exception 'application_user_not_invited';
  end if;

  select * into existing_seller
  from public.sellers
  where owner_user_id = application.applicant_user_id
  for update;

  if found and existing_seller.status <> 'closed' then
    raise exception 'seller_already_exists';
  end if;

  if existing_seller.id is not null then
    update public.sellers
    set approved_application_id = application.id,
        legal_name = application.legal_name,
        tax_number = application.tax_number,
        status = 'active',
        updated_at = now()
    where id = existing_seller.id
    returning id into created_seller_id;

    select id into created_store_id
    from public.stores
    where seller_id = created_seller_id
    order by created_at
    limit 1
    for update;

    if created_store_id is null then
      insert into public.stores (seller_id, name, slug, status)
      values (created_seller_id, application.store_name, p_store_slug, 'active')
      returning id into created_store_id;
    else
      update public.stores
      set name = application.store_name,
          slug = p_store_slug,
          status = 'active',
          updated_at = now()
      where id = created_store_id;
    end if;

    insert into public.store_members (store_id, user_id, role, status, created_by)
    values (created_store_id, application.applicant_user_id, 'owner', 'active', p_reviewer_id)
    on conflict (store_id, user_id) do update
    set role = 'owner', status = 'active', created_by = excluded.created_by, updated_at = now();
  else
    insert into public.sellers (owner_user_id, approved_application_id, legal_name, tax_number, status)
    values (application.applicant_user_id, application.id, application.legal_name, application.tax_number, 'active')
    returning id into created_seller_id;

    insert into public.stores (seller_id, name, slug, status)
    values (created_seller_id, application.store_name, p_store_slug, 'active')
    returning id into created_store_id;

    insert into public.store_members (store_id, user_id, role, status, created_by)
    values (created_store_id, application.applicant_user_id, 'owner', 'active', p_reviewer_id);
  end if;

  update public.seller_applications
  set status = 'approved',
      admin_note = nullif(trim(p_admin_note), ''),
      reviewed_by = p_reviewer_id,
      reviewed_at = now()
  where id = application.id;

  return query select created_seller_id, created_store_id;
end;
$$;

revoke all on function public.approve_seller_application(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.approve_seller_application(uuid, uuid, text, text)
  to service_role;

commit;
