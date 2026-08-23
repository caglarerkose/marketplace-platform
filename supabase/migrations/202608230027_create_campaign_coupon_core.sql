begin;

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(trim(description)) <= 2000),
  campaign_type text not null check (campaign_type in ('percentage', 'fixed_amount', 'free_shipping')),
  discount_value numeric(14,2) not null default 0 check (discount_value >= 0),
  minimum_cart_total numeric(14,2) not null default 0 check (minimum_cart_total >= 0),
  maximum_discount numeric(14,2) check (maximum_discount is null or maximum_discount >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'ended', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (campaign_type <> 'percentage' or discount_value between 0.01 and 100)
);

create index campaigns_status_period_idx on public.campaigns(status, starts_at, ends_at);

create table public.campaign_offers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  offer_id uuid not null references public.seller_offers(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  campaign_price numeric(14,2) check (campaign_price is null or campaign_price >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  rejection_reason text check (rejection_reason is null or char_length(trim(rejection_reason)) <= 1000),
  submitted_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id, offer_id)
);

create index campaign_offers_campaign_status_idx on public.campaign_offers(campaign_id, status, created_at desc);
create index campaign_offers_store_status_idx on public.campaign_offers(store_id, status, created_at desc);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  code text not null check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,32}$'),
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount', 'free_shipping')),
  discount_value numeric(14,2) not null default 0 check (discount_value >= 0),
  minimum_cart_total numeric(14,2) not null default 0 check (minimum_cart_total >= 0),
  maximum_discount numeric(14,2) check (maximum_discount is null or maximum_discount >= 0),
  total_usage_limit integer check (total_usage_limit is null or total_usage_limit > 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'expired', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(code),
  check (ends_at > starts_at),
  check (discount_type <> 'percentage' or discount_value between 0.01 and 100)
);

create index coupons_status_period_idx on public.coupons(status, starts_at, ends_at);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  discount_amount numeric(14,2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now(),
  unique(coupon_id, order_id)
);

create index coupon_redemptions_coupon_time_idx on public.coupon_redemptions(coupon_id, created_at desc);
create index coupon_redemptions_customer_time_idx on public.coupon_redemptions(customer_user_id, created_at desc);

create trigger campaigns_set_updated_at before update on public.campaigns
for each row execute function public.set_updated_at();
create trigger campaign_offers_set_updated_at before update on public.campaign_offers
for each row execute function public.set_updated_at();
create trigger coupons_set_updated_at before update on public.coupons
for each row execute function public.set_updated_at();

create or replace function public.submit_campaign_offer(p_campaign_id uuid, p_offer_id uuid, p_campaign_price numeric default null)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare
  user_id uuid := auth.uid();
  offer_record public.seller_offers%rowtype;
  campaign_record public.campaigns%rowtype;
  participation_id uuid;
begin
  if user_id is null then raise exception 'authentication_required'; end if;
  select * into campaign_record from public.campaigns where id = p_campaign_id and status in ('scheduled', 'active') and ends_at > now();
  if not found then raise exception 'campaign_not_available'; end if;
  select * into offer_record from public.seller_offers where id = p_offer_id and status = 'active';
  if not found then raise exception 'offer_not_available'; end if;
  if not exists(select 1 from public.store_members member where member.store_id = offer_record.store_id and member.user_id = user_id and member.status = 'active') then raise exception 'store_access_denied'; end if;
  if p_campaign_price is not null and (p_campaign_price < 0 or p_campaign_price >= offer_record.price) then raise exception 'invalid_campaign_price'; end if;

  insert into public.campaign_offers(campaign_id, offer_id, store_id, campaign_price, submitted_by)
  values(p_campaign_id, p_offer_id, offer_record.store_id, p_campaign_price, user_id)
  on conflict(campaign_id, offer_id) do update set campaign_price = excluded.campaign_price,
    status = 'pending', rejection_reason = null, submitted_by = user_id, reviewed_by = null, reviewed_at = null
  returning id into participation_id;
  return participation_id;
end;
$$;

create or replace function public.review_campaign_offer(p_participation_id uuid, p_decision text, p_reason text default null)
returns void language plpgsql security definer set search_path = public, auth as $$
declare user_id uuid := auth.uid();
begin
  if user_id is null or not exists(select 1 from public.admin_users admin_user where admin_user.user_id = user_id and admin_user.status = 'active') then raise exception 'admin_access_denied'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'invalid_decision'; end if;
  update public.campaign_offers set status = p_decision, rejection_reason = case when p_decision = 'rejected' then nullif(trim(p_reason), '') else null end,
    reviewed_by = user_id, reviewed_at = now() where id = p_participation_id and status = 'pending';
  if not found then raise exception 'participation_not_found'; end if;
end;
$$;

create or replace function public.preview_coupon(p_code text, p_cart_total numeric)
returns table(coupon_id uuid, discount_type text, discount_amount numeric) language plpgsql stable security definer set search_path = public, auth as $$
declare coupon_record public.coupons%rowtype; used_count integer; user_used_count integer;
begin
  select * into coupon_record from public.coupons where code = upper(trim(p_code)) and status = 'active' and now() between starts_at and ends_at;
  if not found then raise exception 'coupon_not_available'; end if;
  if p_cart_total < coupon_record.minimum_cart_total then raise exception 'minimum_cart_total_not_met'; end if;
  select count(*) into used_count from public.coupon_redemptions where coupon_redemptions.coupon_id = coupon_record.id;
  if coupon_record.total_usage_limit is not null and used_count >= coupon_record.total_usage_limit then raise exception 'coupon_limit_reached'; end if;
  if auth.uid() is not null then
    select count(*) into user_used_count from public.coupon_redemptions where coupon_redemptions.coupon_id = coupon_record.id and customer_user_id = auth.uid();
    if user_used_count >= coupon_record.per_user_limit then raise exception 'customer_coupon_limit_reached'; end if;
  end if;
  coupon_id := coupon_record.id; discount_type := coupon_record.discount_type;
  discount_amount := case coupon_record.discount_type when 'percentage' then p_cart_total * coupon_record.discount_value / 100 when 'fixed_amount' then coupon_record.discount_value else 0 end;
  if coupon_record.maximum_discount is not null then discount_amount := least(discount_amount, coupon_record.maximum_discount); end if;
  discount_amount := least(discount_amount, p_cart_total); return next;
end;
$$;

alter table public.campaigns enable row level security;
alter table public.campaign_offers enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
revoke all on table public.campaigns, public.campaign_offers, public.coupons, public.coupon_redemptions from anon, authenticated;
grant select on table public.campaigns, public.campaign_offers to anon, authenticated;
grant select on table public.coupons, public.coupon_redemptions to authenticated;
grant select, insert, update, delete on table public.campaigns, public.campaign_offers, public.coupons, public.coupon_redemptions to service_role;

create policy "campaigns_public_read" on public.campaigns for select to anon, authenticated
using(status in ('scheduled', 'active') and ends_at > now());
create policy "campaign_offers_public_read" on public.campaign_offers for select to anon, authenticated
using(status = 'approved' and exists(select 1 from public.campaigns campaign where campaign.id = campaign_id and campaign.status = 'active' and now() between campaign.starts_at and campaign.ends_at));
create policy "campaign_offers_store_read" on public.campaign_offers for select to authenticated
using(exists(select 1 from public.store_members member where member.store_id = campaign_offers.store_id and member.user_id = (select auth.uid()) and member.status = 'active'));
create policy "coupons_customer_read" on public.coupons for select to authenticated
using(status = 'active' and now() between starts_at and ends_at);
create policy "coupon_redemptions_customer_read" on public.coupon_redemptions for select to authenticated
using(customer_user_id = (select auth.uid()));

revoke all on function public.submit_campaign_offer(uuid,uuid,numeric) from public, anon;
revoke all on function public.review_campaign_offer(uuid,text,text) from public, anon;
revoke all on function public.preview_coupon(text,numeric) from public, anon;
grant execute on function public.submit_campaign_offer(uuid,uuid,numeric) to authenticated, service_role;
grant execute on function public.review_campaign_offer(uuid,text,text) to authenticated, service_role;
grant execute on function public.preview_coupon(text,numeric) to authenticated, service_role;

commit;
