begin;

create or replace function public.create_order_from_cart(
  p_address_id uuid,
  p_checkout_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  customer_id uuid := auth.uid();
  cart_record public.customer_carts%rowtype;
  address_record public.customer_addresses%rowtype;
  cart_item record;
  warehouse_id uuid;
  order_id uuid := gen_random_uuid();
  created_order public.orders%rowtype;
  subtotal_value numeric(14,2);
  selected_count integer;
  valid_count integer;
begin
  if customer_id is null then raise exception 'authentication_required'; end if;
  if p_checkout_key is null then raise exception 'checkout_key_required'; end if;

  select * into address_record from public.customer_addresses
  where id = p_address_id and user_id = customer_id;
  if not found then raise exception 'address_not_found'; end if;

  select * into cart_record from public.customer_carts
  where user_id = customer_id and status = 'active'
  for update;
  if not found then raise exception 'active_cart_not_found'; end if;

  select count(*) into selected_count from public.customer_cart_items
  where cart_id = cart_record.id and is_selected = true;
  if selected_count = 0 then raise exception 'selected_cart_empty'; end if;

  select count(*), coalesce(sum(offer.price * item.quantity), 0)
  into valid_count, subtotal_value
  from public.customer_cart_items item
  join public.seller_offers offer on offer.id = item.offer_id and offer.status = 'active'
  join public.stores store on store.id = offer.store_id and store.status = 'active'
  join public.product_variants variant on variant.id = offer.variant_id and variant.status = 'active'
  join public.catalog_products product on product.id = variant.product_id and product.status = 'active'
  where item.cart_id = cart_record.id and item.is_selected = true;
  if valid_count <> selected_count then raise exception 'cart_contains_unavailable_product'; end if;

  insert into public.orders (
    id, customer_user_id, source_cart_id, checkout_key, status, payment_status,
    currency, subtotal, shipping_address, billing_address, placed_at
  ) values (
    order_id, customer_id, cart_record.id, p_checkout_key, 'created', 'pending',
    'TRY', subtotal_value,
    jsonb_build_object(
      'title', address_record.title, 'recipient_name', address_record.recipient_name,
      'phone', address_record.phone, 'city', address_record.city,
      'district', address_record.district, 'neighborhood', address_record.neighborhood,
      'address_line', address_record.address_line, 'postal_code', address_record.postal_code
    ),
    jsonb_build_object(
      'title', address_record.title, 'recipient_name', address_record.recipient_name,
      'phone', address_record.phone, 'city', address_record.city,
      'district', address_record.district, 'neighborhood', address_record.neighborhood,
      'address_line', address_record.address_line, 'postal_code', address_record.postal_code
    ), now()
  ) returning * into created_order;

  for cart_item in
    select item.quantity, offer.id as offer_id, offer.store_id, offer.seller_sku,
      offer.price, offer.currency, variant.id as variant_id, variant.title as variant_title,
      variant.attribute_values, product.id as product_id, product.title as product_title,
      store.name as seller_name,
      (select media.url from public.product_media media
       where media.product_id = product.id
         and (media.variant_id is null or media.variant_id = variant.id)
       order by (media.variant_id = variant.id) desc, media.is_primary desc, media.sort_order
       limit 1) as product_image_url
    from public.customer_cart_items item
    join public.seller_offers offer on offer.id = item.offer_id
    join public.stores store on store.id = offer.store_id
    join public.product_variants variant on variant.id = offer.variant_id
    join public.catalog_products product on product.id = variant.product_id
    where item.cart_id = cart_record.id and item.is_selected = true
    order by item.created_at
  loop
    if cart_item.currency <> 'TRY' then raise exception 'mixed_currency_not_supported'; end if;

    select balance.warehouse_id into warehouse_id
    from public.inventory_balances balance
    join public.warehouses warehouse on warehouse.id = balance.warehouse_id
    where balance.offer_id = cart_item.offer_id
      and warehouse.store_id = cart_item.store_id
      and warehouse.status = 'active'
      and balance.available >= cart_item.quantity
    order by balance.available desc
    limit 1
    for update of balance;
    if warehouse_id is null then raise exception 'insufficient_inventory'; end if;

    perform public.reserve_inventory(
      warehouse_id, cart_item.offer_id, cart_item.quantity,
      'order', order_id::text, now() + interval '24 hours', customer_id
    );

    insert into public.order_items (
      order_id, store_id, offer_id, product_id, variant_id, product_title,
      variant_title, seller_name, seller_sku, product_image_url,
      variant_attributes, quantity, unit_price
    ) values (
      order_id, cart_item.store_id, cart_item.offer_id, cart_item.product_id,
      cart_item.variant_id, cart_item.product_title, cart_item.variant_title,
      cart_item.seller_name, cart_item.seller_sku, cart_item.product_image_url,
      cart_item.attribute_values, cart_item.quantity, cart_item.price
    );
    warehouse_id := null;
  end loop;

  insert into public.order_status_history (order_id, new_status, note, actor_user_id)
  values (order_id, 'created', 'Sipariş oluşturuldu.', customer_id);

  delete from public.customer_cart_items
  where cart_id = cart_record.id and is_selected = true;
  update public.customer_carts set status = 'converted' where id = cart_record.id;

  return jsonb_build_object(
    'id', created_order.id,
    'order_number', created_order.order_number,
    'status', created_order.status,
    'grand_total', created_order.grand_total
  );
exception
  when unique_violation then
    select * into created_order from public.orders
    where customer_user_id = customer_id and checkout_key = p_checkout_key;
    if found then
      return jsonb_build_object(
        'id', created_order.id,
        'order_number', created_order.order_number,
        'status', created_order.status,
        'grand_total', created_order.grand_total
      );
    end if;
    raise;
end;
$$;

revoke all on function public.create_order_from_cart(uuid, uuid) from public, anon;
grant execute on function public.create_order_from_cart(uuid, uuid) to authenticated, service_role;

commit;
