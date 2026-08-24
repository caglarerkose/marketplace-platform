begin;
alter table public.product_reviews add column if not exists seller_reply text check(seller_reply is null or char_length(trim(seller_reply)) between 1 and 2000);
alter table public.product_reviews add column if not exists replied_by uuid references auth.users(id) on delete set null;
alter table public.product_reviews add column if not exists replied_at timestamptz;
create or replace function public.reply_to_product_review(p_review_id uuid,p_reply text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare uid uuid:=auth.uid();review_store uuid;
begin
 if uid is null then raise exception 'authentication_required';end if;
 if char_length(trim(coalesce(p_reply,''))) not between 1 and 2000 then raise exception 'invalid_reply';end if;
 select store_id into review_store from public.product_reviews where id=p_review_id;
 if review_store is null then raise exception 'review_not_found';end if;
 if not exists(select 1 from public.store_members where store_id=review_store and user_id=uid and status='active') then raise exception 'store_access_denied';end if;
 update public.product_reviews set seller_reply=trim(p_reply),replied_by=uid,replied_at=now() where id=p_review_id;
end;$$;
revoke all on function public.reply_to_product_review(uuid,text) from public,anon;
grant execute on function public.reply_to_product_review(uuid,text) to authenticated,service_role;
commit;
