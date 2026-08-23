begin;

create or replace function public.create_order_from_cart(
  p_address_id uuid,
  p_checkout_key uuid,
  p_coupon_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  customer_id uuid := auth.uid();
  coupon_record public.coupons%rowtype;
  order_result jsonb;
  order_record public.orders%rowtype;
  discount_value numeric(14,2) := 0;
  total_uses integer;
  customer_uses integer;
begin
  if customer_id is null then raise exception 'authentication_required'; end if;

  if nullif(trim(p_coupon_code), '') is null then
    return public.create_order_from_cart(p_address_id, p_checkout_key);
  end if;

  select * into coupon_record
  from public.coupons
  where code = upper(trim(p_coupon_code))
    and status = 'active'
    and now() between starts_at and ends_at
  for update;
  if not found then raise exception 'coupon_not_available'; end if;

  select * into order_record from public.orders
  where customer_user_id = customer_id and checkout_key = p_checkout_key;
  if found then
    return jsonb_build_object(
      'id', order_record.id,
      'order_number', order_record.order_number,
      'status', order_record.status,
      'grand_total', order_record.grand_total,
      'discount_total', order_record.discount_total,
      'coupon_code', coupon_record.code
    );
  end if;

  select count(*) into total_uses from public.coupon_redemptions
  where coupon_id = coupon_record.id;
  if coupon_record.total_usage_limit is not null and total_uses >= coupon_record.total_usage_limit then
    raise exception 'coupon_limit_reached';
  end if;

  select count(*) into customer_uses from public.coupon_redemptions
  where coupon_id = coupon_record.id and customer_user_id = customer_id;
  if customer_uses >= coupon_record.per_user_limit then
    raise exception 'customer_coupon_limit_reached';
  end if;

  order_result := public.create_order_from_cart(p_address_id, p_checkout_key);
  select * into order_record from public.orders where id = (order_result->>'id')::uuid for update;
  if order_record.subtotal < coupon_record.minimum_cart_total then raise exception 'minimum_cart_total_not_met'; end if;

  discount_value := case coupon_record.discount_type
    when 'percentage' then order_record.subtotal * coupon_record.discount_value / 100
    when 'fixed_amount' then coupon_record.discount_value
    else 0
  end;
  if coupon_record.maximum_discount is not null then
    discount_value := least(discount_value, coupon_record.maximum_discount);
  end if;
  discount_value := round(least(discount_value, order_record.subtotal), 2);

  update public.orders
  set discount_total = discount_value,
      shipping_total = case when coupon_record.discount_type = 'free_shipping' then 0 else shipping_total end
  where id = order_record.id
  returning * into order_record;

  insert into public.coupon_redemptions(coupon_id, customer_user_id, order_id, discount_amount)
  values(coupon_record.id, customer_id, order_record.id, discount_value);

  insert into public.order_status_history(order_id, new_status, note, actor_user_id)
  values(order_record.id, order_record.status, 'Kupon uygulandı: ' || coupon_record.code, customer_id);

  return jsonb_build_object(
    'id', order_record.id,
    'order_number', order_record.order_number,
    'status', order_record.status,
    'grand_total', order_record.grand_total,
    'discount_total', order_record.discount_total,
    'coupon_code', coupon_record.code
  );
end;
$$;

revoke all on function public.create_order_from_cart(uuid,uuid,text) from public, anon;
grant execute on function public.create_order_from_cart(uuid,uuid,text) to authenticated, service_role;

commit;
