begin;

create or replace function public.preserve_cart_with_remaining_items()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'converted' and exists (
    select 1 from public.customer_cart_items item where item.cart_id = new.id
  ) then
    new.status := 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists customer_carts_preserve_partial on public.customer_carts;
create trigger customer_carts_preserve_partial
before update of status on public.customer_carts
for each row execute function public.preserve_cart_with_remaining_items();

update public.customer_carts cart
set status = 'active'
where cart.status = 'converted'
  and exists (select 1 from public.customer_cart_items item where item.cart_id = cart.id)
  and not exists (
    select 1 from public.customer_carts active_cart
    where active_cart.user_id = cart.user_id
      and active_cart.status = 'active'
      and active_cart.id <> cart.id
  );

commit;
