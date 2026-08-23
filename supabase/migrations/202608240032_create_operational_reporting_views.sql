begin;

create or replace view public.marketplace_daily_metrics
with (security_invoker = true)
as
with order_metrics as (
  select created_at::date as metric_date,
    count(*) as order_count,
    count(distinct customer_user_id) as ordering_customer_count,
    coalesce(sum(subtotal),0)::numeric(14,2) as gross_merchandise_value,
    coalesce(sum(discount_total),0)::numeric(14,2) as discount_total,
    count(*) filter(where status='cancelled') as cancelled_order_count
  from public.orders group by created_at::date
), seller_metrics as (
  select created_at::date as metric_date,
    count(*) filter(where status='active') as activated_store_count
  from public.stores group by created_at::date
), product_metrics as (
  select created_at::date as metric_date,
    count(*) as submitted_product_count,
    count(*) filter(where status='active') as activated_product_count,
    count(*) filter(where status='rejected') as rejected_product_count
  from public.catalog_products group by created_at::date
)
select coalesce(o.metric_date,s.metric_date,p.metric_date) as metric_date,
  coalesce(o.order_count,0) as order_count,
  coalesce(o.ordering_customer_count,0) as ordering_customer_count,
  coalesce(o.gross_merchandise_value,0)::numeric(14,2) as gross_merchandise_value,
  coalesce(o.discount_total,0)::numeric(14,2) as discount_total,
  coalesce(o.cancelled_order_count,0) as cancelled_order_count,
  coalesce(s.activated_store_count,0) as activated_store_count,
  coalesce(p.submitted_product_count,0) as submitted_product_count,
  coalesce(p.activated_product_count,0) as activated_product_count,
  coalesce(p.rejected_product_count,0) as rejected_product_count
from order_metrics o full join seller_metrics s using(metric_date)
full join product_metrics p on p.metric_date=coalesce(o.metric_date,s.metric_date);

create or replace view public.seller_daily_metrics
with (security_invoker = true)
as
select item.store_id,item.created_at::date as metric_date,
  count(distinct item.order_id) as order_count,
  sum(item.quantity)::bigint as unit_count,
  coalesce(sum(item.line_total),0)::numeric(14,2) as gross_sales,
  count(*) filter(where item.fulfillment_status='cancelled') as cancelled_item_count,
  count(*) filter(where item.fulfillment_status='returned') as returned_item_count,
  count(*) filter(where item.fulfillment_status='delivered') as delivered_item_count
from public.order_items item group by item.store_id,item.created_at::date;

create or replace view public.seller_finance_summary
with (security_invoker = true)
as
select entry.store_id,
  coalesce(sum(entry.amount) filter(where entry.entry_type='sale'),0)::numeric(14,2) as gross_sales,
  abs(coalesce(sum(entry.amount) filter(where entry.entry_type in ('commission','service_fee')),0))::numeric(14,2) as platform_deductions,
  coalesce(sum(entry.amount) filter(where entry.entry_type in ('refund','adjustment')),0)::numeric(14,2) as adjustments,
  coalesce(sum(entry.amount) filter(where entry.available_at<=now() and entry.settlement_id is null),0)::numeric(14,2) as available_balance,
  coalesce(sum(entry.amount) filter(where entry.available_at>now() and entry.settlement_id is null),0)::numeric(14,2) as pending_balance
from public.seller_ledger_entries entry group by entry.store_id;

revoke all on table public.marketplace_daily_metrics,public.seller_daily_metrics,public.seller_finance_summary from anon,authenticated;
grant select on table public.marketplace_daily_metrics,public.seller_daily_metrics,public.seller_finance_summary to authenticated,service_role;

commit;
