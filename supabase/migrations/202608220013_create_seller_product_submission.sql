begin;

create or replace function public.create_seller_product_submission(
  p_actor_user_id uuid,
  p_store_id uuid,
  p_category_id uuid,
  p_title text,
  p_description text,
  p_slug text,
  p_variant_title text,
  p_sku text,
  p_barcode text,
  p_price numeric,
  p_list_price numeric
)
returns table (product_id uuid, variant_id uuid, offer_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  created_product_id uuid;
  created_variant_id uuid;
  created_offer_id uuid;
begin
  if not exists (
    select 1 from public.store_members
    where store_id = p_store_id
      and user_id = p_actor_user_id
      and status = 'active'
      and role in ('owner', 'admin', 'catalog')
  ) then
    raise exception 'store_access_denied';
  end if;

  if not exists (
    select 1 from public.categories where id = p_category_id and status = 'active'
  ) then
    raise exception 'category_not_available';
  end if;

  insert into public.catalog_products (
    category_id, title, slug, description, status, created_by
  ) values (
    p_category_id, trim(p_title), p_slug, nullif(trim(p_description), ''), 'pending', p_actor_user_id
  ) returning id into created_product_id;

  insert into public.product_variants (
    product_id, sku, barcode, title, status
  ) values (
    created_product_id, trim(p_sku), nullif(trim(p_barcode), ''), trim(p_variant_title), 'active'
  ) returning id into created_variant_id;

  insert into public.seller_offers (
    store_id, variant_id, seller_sku, price, list_price, status, created_by
  ) values (
    p_store_id, created_variant_id, trim(p_sku), p_price, p_list_price, 'pending', p_actor_user_id
  ) returning id into created_offer_id;

  return query select created_product_id, created_variant_id, created_offer_id;
end;
$$;

revoke all on function public.create_seller_product_submission(
  uuid, uuid, uuid, text, text, text, text, text, text, numeric, numeric
) from public, anon, authenticated;
grant execute on function public.create_seller_product_submission(
  uuid, uuid, uuid, text, text, text, text, text, text, numeric, numeric
) to service_role;

commit;
