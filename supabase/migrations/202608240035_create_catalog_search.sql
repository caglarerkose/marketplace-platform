begin;

alter table public.catalog_products
  add column if not exists search_vector tsvector
  generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))) stored;

create index if not exists catalog_products_search_vector_idx
  on public.catalog_products using gin(search_vector);

create or replace function public.search_active_offers(
  p_query text default null,
  p_category_slug text default null,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_in_stock boolean default false,
  p_sort text default 'relevance',
  p_limit integer default 48,
  p_offset integer default 0
)
returns table (
  offer_id uuid, product_id uuid, slug text, title text, description text,
  variant_title text, price numeric, list_price numeric, store_name text,
  category_name text, category_slug text, image_url text,
  available_stock bigint, review_count bigint, average_rating numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select offer.id, product.id, product.slug, product.title, product.description,
    variant.title, offer.price, offer.list_price, store.name,
    category.name, category.slug, media.url,
    coalesce(stock.available, 0), coalesce(review.review_count, 0), coalesce(review.average_rating, 0)
  from public.seller_offers offer
  join public.stores store on store.id = offer.store_id and store.status = 'active'
  join public.product_variants variant on variant.id = offer.variant_id and variant.status = 'active'
  join public.catalog_products product on product.id = variant.product_id and product.status = 'active'
  join public.categories category on category.id = product.category_id and category.status = 'active'
  left join lateral (
    select pm.url from public.product_media pm
    where pm.product_id = product.id and pm.media_type = 'image'
    order by pm.is_primary desc, pm.sort_order, pm.created_at limit 1
  ) media on true
  left join lateral (
    select sum(balance.available)::bigint as available
    from public.inventory_balances balance where balance.offer_id = offer.id
  ) stock on true
  left join lateral (
    select count(*)::bigint as review_count, round(avg(r.rating)::numeric, 2) as average_rating
    from public.product_reviews r where r.product_id = product.id and r.status = 'published'
  ) review on true
  where offer.status = 'active'
    and (nullif(trim(p_query), '') is null or product.search_vector @@ websearch_to_tsquery('simple', trim(p_query)))
    and (p_category_slug is null or category.slug = p_category_slug)
    and (p_min_price is null or offer.price >= p_min_price)
    and (p_max_price is null or offer.price <= p_max_price)
    and (not p_in_stock or coalesce(stock.available, 0) > 0)
  order by
    case when p_sort = 'price_asc' then offer.price end asc,
    case when p_sort = 'price_desc' then offer.price end desc,
    case when p_sort = 'reviews' then coalesce(review.review_count, 0) end desc,
    case when p_sort = 'newest' then offer.created_at end desc,
    case when p_sort = 'relevance' and nullif(trim(p_query), '') is not null then ts_rank(product.search_vector, websearch_to_tsquery('simple', trim(p_query))) end desc,
    offer.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.search_active_offers(text,text,numeric,numeric,boolean,text,integer,integer) from public;
grant execute on function public.search_active_offers(text,text,numeric,numeric,boolean,text,integer,integer) to anon, authenticated, service_role;

commit;
