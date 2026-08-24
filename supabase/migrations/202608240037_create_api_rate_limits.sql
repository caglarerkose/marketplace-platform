begin;
create table if not exists public.api_rate_limits(
  scope text not null, subject_hash text not null, window_started_at timestamptz not null,
  request_count integer not null default 1 check(request_count > 0), updated_at timestamptz not null default now(),
  primary key(scope,subject_hash)
);
create index if not exists api_rate_limits_updated_idx on public.api_rate_limits(updated_at);
alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from anon,authenticated;
grant select,insert,update,delete on table public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(p_scope text,p_subject_hash text,p_limit integer,p_window_seconds integer)
returns table(allowed boolean,remaining integer,retry_after_seconds integer)
language plpgsql security definer set search_path=''
as $$
declare current_row public.api_rate_limits%rowtype; now_at timestamptz:=clock_timestamp();
begin
  if p_limit < 1 or p_window_seconds < 1 or length(p_scope) > 100 or length(p_subject_hash) <> 64 then raise exception 'invalid_rate_limit'; end if;
  insert into public.api_rate_limits(scope,subject_hash,window_started_at,request_count,updated_at)
  values(p_scope,p_subject_hash,now_at,1,now_at)
  on conflict(scope,subject_hash) do update set
    window_started_at=case when public.api_rate_limits.window_started_at + make_interval(secs=>p_window_seconds) <= now_at then now_at else public.api_rate_limits.window_started_at end,
    request_count=case when public.api_rate_limits.window_started_at + make_interval(secs=>p_window_seconds) <= now_at then 1 else public.api_rate_limits.request_count+1 end,
    updated_at=now_at returning * into current_row;
  allowed:=current_row.request_count<=p_limit;
  remaining:=greatest(p_limit-current_row.request_count,0);
  retry_after_seconds:=case when allowed then 0 else greatest(1,ceil(extract(epoch from(current_row.window_started_at+make_interval(secs=>p_window_seconds)-now_at)))::integer) end;
  return next;
end;$$;
revoke all on function public.consume_api_rate_limit(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_api_rate_limit(text,text,integer,integer) to service_role;
commit;
