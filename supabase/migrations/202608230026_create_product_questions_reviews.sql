begin;

create table public.product_questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  offer_id uuid not null references public.seller_offers(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(trim(question)) between 5 and 1000),
  answer text check (answer is null or char_length(trim(answer)) between 1 and 2000),
  answered_by uuid references auth.users(id) on delete set null,
  answered_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  moderation_note text check (char_length(coalesce(moderation_note, '')) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_questions_product_status_time_idx
  on public.product_questions(product_id, status, created_at desc);
create index product_questions_store_status_time_idx
  on public.product_questions(store_id, status, created_at desc);
create index product_questions_customer_time_idx
  on public.product_questions(customer_user_id, created_at desc);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text check (title is null or char_length(trim(title)) between 2 and 160),
  body text check (body is null or char_length(trim(body)) between 2 and 2000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  moderation_note text check (char_length(coalesce(moderation_note, '')) <= 1000),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_item_id)
);

create index product_reviews_product_status_time_idx
  on public.product_reviews(product_id, status, created_at desc);
create index product_reviews_store_status_time_idx
  on public.product_reviews(store_id, status, created_at desc);
create index product_reviews_customer_time_idx
  on public.product_reviews(customer_user_id, created_at desc);

create trigger product_questions_set_updated_at before update on public.product_questions
for each row execute function public.set_updated_at();
create trigger product_reviews_set_updated_at before update on public.product_reviews
for each row execute function public.set_updated_at();

create or replace function public.create_product_question(p_offer_id uuid, p_question text)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare
  user_id uuid := auth.uid();
  offer_record record;
  question_id uuid;
begin
  if user_id is null then raise exception 'authentication_required'; end if;
  if char_length(trim(coalesce(p_question, ''))) not between 5 and 1000 then raise exception 'invalid_question'; end if;

  select offer.id, offer.store_id, variant.product_id into offer_record
  from public.seller_offers offer
  join public.product_variants variant on variant.id = offer.variant_id
  join public.catalog_products product on product.id = variant.product_id
  join public.stores store on store.id = offer.store_id
  where offer.id = p_offer_id and offer.status = 'active'
    and variant.status = 'active' and product.status = 'active' and store.status = 'active';
  if not found then raise exception 'offer_not_available'; end if;

  insert into public.product_questions(product_id, offer_id, store_id, customer_user_id, question)
  values(offer_record.product_id, offer_record.id, offer_record.store_id, user_id, trim(p_question))
  returning id into question_id;

  insert into public.user_notifications(user_id, panel, notification_type, title, body, link, entity_type, entity_id)
  select member.user_id, 'seller', 'product_question', 'Yeni ürün sorusu',
    'Bir müşteri ürün teklifiniz hakkında soru sordu.', '/panel', 'product_question', question_id
  from public.store_members member
  where member.store_id = offer_record.store_id and member.status = 'active';

  return question_id;
end;
$$;

create or replace function public.answer_product_question(p_question_id uuid, p_answer text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  user_id uuid := auth.uid();
  question_record public.product_questions%rowtype;
begin
  if user_id is null then raise exception 'authentication_required'; end if;
  if char_length(trim(coalesce(p_answer, ''))) not between 1 and 2000 then raise exception 'invalid_answer'; end if;
  select * into question_record from public.product_questions where id = p_question_id for update;
  if not found then raise exception 'question_not_found'; end if;
  if not exists(select 1 from public.store_members member where member.store_id = question_record.store_id and member.user_id = user_id and member.status = 'active') then
    raise exception 'store_access_denied';
  end if;

  update public.product_questions set answer = trim(p_answer), answered_by = user_id,
    answered_at = now(), status = 'pending' where id = p_question_id;
end;
$$;

create or replace function public.create_product_review(
  p_order_item_id uuid, p_rating smallint, p_title text default null, p_body text default null
)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare
  user_id uuid := auth.uid();
  item_record record;
  review_id uuid;
begin
  if user_id is null then raise exception 'authentication_required'; end if;
  if p_rating not between 1 and 5 then raise exception 'invalid_rating'; end if;
  if p_title is not null and char_length(trim(p_title)) not between 2 and 160 then raise exception 'invalid_title'; end if;
  if p_body is not null and char_length(trim(p_body)) not between 2 and 2000 then raise exception 'invalid_body'; end if;

  select item.id, item.product_id, item.store_id into item_record
  from public.order_items item join public.orders customer_order on customer_order.id = item.order_id
  where item.id = p_order_item_id and customer_order.customer_user_id = user_id
    and item.fulfillment_status = 'delivered' and item.product_id is not null;
  if not found then raise exception 'delivered_purchase_required'; end if;

  insert into public.product_reviews(product_id, store_id, order_item_id, customer_user_id, rating, title, body)
  values(item_record.product_id, item_record.store_id, item_record.id, user_id, p_rating, nullif(trim(p_title), ''), nullif(trim(p_body), ''))
  returning id into review_id;
  return review_id;
exception when unique_violation then
  raise exception 'review_already_exists';
end;
$$;

create or replace function public.moderate_product_content(
  p_content_type text, p_content_id uuid, p_decision text, p_note text default null
)
returns void language plpgsql security definer set search_path = public, auth as $$
declare user_id uuid := auth.uid();
begin
  if user_id is null or not exists(select 1 from public.admin_users admin_user where admin_user.user_id = user_id and admin_user.status = 'active') then
    raise exception 'admin_access_denied';
  end if;
  if p_decision not in ('published', 'rejected') then raise exception 'invalid_decision'; end if;

  if p_content_type = 'question' then
    update public.product_questions set status = p_decision, moderation_note = nullif(trim(p_note), '') where id = p_content_id;
  elsif p_content_type = 'review' then
    update public.product_reviews set status = p_decision, moderation_note = nullif(trim(p_note), ''),
      published_at = case when p_decision = 'published' then now() else null end where id = p_content_id;
  else
    raise exception 'invalid_content_type';
  end if;
  if not found then raise exception 'content_not_found'; end if;
end;
$$;

alter table public.product_questions enable row level security;
alter table public.product_reviews enable row level security;
revoke all on table public.product_questions, public.product_reviews from anon, authenticated;
grant select on table public.product_questions, public.product_reviews to anon, authenticated;
grant select, insert, update, delete on table public.product_questions, public.product_reviews to service_role;

create policy "product_questions_public_read" on public.product_questions for select to anon, authenticated
using(status = 'published');
create policy "product_questions_customer_read" on public.product_questions for select to authenticated
using(customer_user_id = (select auth.uid()));
create policy "product_questions_store_read" on public.product_questions for select to authenticated
using(exists(select 1 from public.store_members member where member.store_id = product_questions.store_id and member.user_id = (select auth.uid()) and member.status = 'active'));

create policy "product_reviews_public_read" on public.product_reviews for select to anon, authenticated
using(status = 'published');
create policy "product_reviews_customer_read" on public.product_reviews for select to authenticated
using(customer_user_id = (select auth.uid()));
create policy "product_reviews_store_read" on public.product_reviews for select to authenticated
using(exists(select 1 from public.store_members member where member.store_id = product_reviews.store_id and member.user_id = (select auth.uid()) and member.status = 'active'));

revoke all on function public.create_product_question(uuid,text) from public, anon;
revoke all on function public.answer_product_question(uuid,text) from public, anon;
revoke all on function public.create_product_review(uuid,smallint,text,text) from public, anon;
revoke all on function public.moderate_product_content(text,uuid,text,text) from public, anon;
grant execute on function public.create_product_question(uuid,text) to authenticated, service_role;
grant execute on function public.answer_product_question(uuid,text) to authenticated, service_role;
grant execute on function public.create_product_review(uuid,smallint,text,text) to authenticated, service_role;
grant execute on function public.moderate_product_content(text,uuid,text,text) to authenticated, service_role;

commit;
