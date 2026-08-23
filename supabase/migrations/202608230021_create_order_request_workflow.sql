begin;

create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  request_type text not null check (request_type in ('cancellation', 'return')),
  reason_code text not null check (char_length(trim(reason_code)) between 2 and 80),
  explanation text check (char_length(coalesce(explanation, '')) <= 1000),
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'approved', 'rejected', 'completed', 'withdrawn')),
  resolution_note text check (char_length(coalesce(resolution_note, '')) <= 1000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index order_requests_customer_time_idx
  on public.order_requests(customer_user_id, created_at desc);
create index order_requests_store_status_idx
  on public.order_requests(store_id, status, created_at desc);
create index order_requests_order_idx on public.order_requests(order_id);
create unique index order_requests_open_item_type_idx
  on public.order_requests(order_item_id, request_type)
  where status in ('submitted', 'under_review', 'approved');

create table public.order_request_history (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.order_requests(id) on delete cascade,
  previous_status text,
  new_status text not null,
  note text check (char_length(coalesce(note, '')) <= 1000),
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_request_history_request_time_idx
  on public.order_request_history(request_id, created_at desc);

create trigger order_requests_set_updated_at before update on public.order_requests
for each row execute function public.set_updated_at();

create or replace function public.create_order_request(
  p_order_item_id uuid,
  p_request_type text,
  p_reason_code text,
  p_explanation text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  customer_id uuid := auth.uid();
  item_record record;
  request_id uuid;
begin
  if customer_id is null then raise exception 'authentication_required'; end if;
  if p_request_type not in ('cancellation', 'return') then raise exception 'invalid_request_type'; end if;
  if char_length(trim(coalesce(p_reason_code, ''))) < 2 then raise exception 'reason_required'; end if;
  if char_length(coalesce(p_explanation, '')) > 1000 then raise exception 'explanation_too_long'; end if;

  select item.id, item.order_id, item.store_id, item.fulfillment_status,
    customer_order.status as order_status
  into item_record
  from public.order_items item
  join public.orders customer_order on customer_order.id = item.order_id
  where item.id = p_order_item_id
    and customer_order.customer_user_id = customer_id
  for update of item;
  if not found then raise exception 'order_item_not_found'; end if;

  if p_request_type = 'cancellation' and (
    item_record.fulfillment_status in ('shipped', 'delivered', 'cancelled', 'returned')
    or item_record.order_status in ('cancelled', 'refunded')
  ) then raise exception 'cancellation_not_available'; end if;
  if p_request_type = 'return' and item_record.fulfillment_status <> 'delivered' then
    raise exception 'return_not_available';
  end if;

  insert into public.order_requests (
    order_id, order_item_id, customer_user_id, store_id,
    request_type, reason_code, explanation
  ) values (
    item_record.order_id, item_record.id, customer_id, item_record.store_id,
    p_request_type, trim(p_reason_code), nullif(trim(coalesce(p_explanation, '')), '')
  ) returning id into request_id;

  insert into public.order_request_history (
    request_id, new_status, note, actor_user_id
  ) values (
    request_id, 'submitted', 'Talep müşteri tarafından oluşturuldu.', customer_id
  );

  return request_id;
exception
  when unique_violation then raise exception 'open_request_already_exists';
end;
$$;

alter table public.order_requests enable row level security;
alter table public.order_request_history enable row level security;

revoke all on table public.order_requests, public.order_request_history from anon, authenticated;
grant select on table public.order_requests, public.order_request_history to authenticated;
grant select, insert, update, delete on table public.order_requests, public.order_request_history to service_role;
grant usage, select on sequence public.order_request_history_id_seq to service_role;

create policy "order_requests_customer_select" on public.order_requests for select to authenticated
using (customer_user_id = (select auth.uid()));
create policy "order_requests_store_member_select" on public.order_requests for select to authenticated
using (exists (
  select 1 from public.store_members member
  where member.store_id = order_requests.store_id
    and member.user_id = (select auth.uid())
    and member.status = 'active'
));

create policy "order_request_history_customer_select" on public.order_request_history for select to authenticated
using (exists (
  select 1 from public.order_requests request
  where request.id = request_id and request.customer_user_id = (select auth.uid())
));
create policy "order_request_history_store_member_select" on public.order_request_history for select to authenticated
using (exists (
  select 1 from public.order_requests request
  join public.store_members member on member.store_id = request.store_id
  where request.id = request_id
    and member.user_id = (select auth.uid())
    and member.status = 'active'
));

revoke all on function public.create_order_request(uuid, text, text, text) from public, anon;
grant execute on function public.create_order_request(uuid, text, text, text) to authenticated, service_role;

commit;
