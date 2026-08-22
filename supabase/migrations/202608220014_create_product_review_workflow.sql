begin;

create or replace function public.review_seller_product_submission(
  p_product_id uuid,
  p_offer_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_product_status text;
  current_offer_status text;
begin
  if p_decision not in ('approve', 'reject') then
    raise exception 'invalid_review_decision';
  end if;
  if p_decision = 'reject' and char_length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'rejection_reason_required';
  end if;

  select product.status, offer.status
  into current_product_status, current_offer_status
  from public.catalog_products product
  join public.product_variants variant on variant.product_id = product.id
  join public.seller_offers offer on offer.variant_id = variant.id
  where product.id = p_product_id and offer.id = p_offer_id
  for update of product, offer;

  if not found then raise exception 'submission_not_found'; end if;
  if current_product_status <> 'pending' or current_offer_status <> 'pending' then
    raise exception 'submission_already_reviewed';
  end if;

  if p_decision = 'approve' then
    update public.catalog_products set status = 'active', rejection_reason = null,
      approved_by = p_reviewer_id, approved_at = now() where id = p_product_id;
    update public.seller_offers set status = 'active', rejection_reason = null,
      approved_by = p_reviewer_id, approved_at = now() where id = p_offer_id;
  else
    update public.catalog_products set status = 'rejected', rejection_reason = trim(p_reason),
      approved_by = null, approved_at = null where id = p_product_id;
    update public.seller_offers set status = 'rejected', rejection_reason = trim(p_reason),
      approved_by = null, approved_at = null where id = p_offer_id;
  end if;

  return true;
end;
$$;

revoke all on function public.review_seller_product_submission(uuid, uuid, uuid, text, text)
from public, anon, authenticated;
grant execute on function public.review_seller_product_submission(uuid, uuid, uuid, text, text)
to service_role;

commit;
