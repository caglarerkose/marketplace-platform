begin;
alter function public.search_active_offers(text,text,numeric,numeric,boolean,text,integer,integer) security definer;
alter function public.search_active_offers(text,text,numeric,numeric,boolean,text,integer,integer) set search_path = '';
revoke all on function public.search_active_offers(text,text,numeric,numeric,boolean,text,integer,integer) from public;
grant execute on function public.search_active_offers(text,text,numeric,numeric,boolean,text,integer,integer) to anon,authenticated,service_role;
commit;
