-- LUAHUB SHARE V5 database schema
create extension if not exists pgcrypto;

create table if not exists public.link_submissions (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists link_submissions_status_created_idx
  on public.link_submissions(status, created_at desc);

-- Stores only a salted hash of the visitor identifier, not the raw IP.
create table if not exists public.submission_limits (
  visitor_hash text not null,
  quota_date date not null,
  submission_count integer not null default 0,
  primary key (visitor_hash, quota_date)
);

alter table public.link_submissions enable row level security;
alter table public.submission_limits enable row level security;

-- No public table policies: browser clients cannot read/write tables directly.
revoke all on public.link_submissions from anon, authenticated;
revoke all on public.submission_limits from anon, authenticated;
grant all on public.link_submissions to service_role;
grant all on public.submission_limits to service_role;

-- Atomic quota increment: avoids two simultaneous requests both passing the limit.
create or replace function public.consume_link_quota(p_visitor_hash text, p_daily_limit integer default 5)
returns table(allowed boolean, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_today date := (now() at time zone 'utc')::date;
begin
  insert into public.submission_limits(visitor_hash, quota_date, submission_count)
  values (p_visitor_hash, v_today, 0)
  on conflict (visitor_hash, quota_date) do nothing;

  perform pg_advisory_xact_lock(hashtext(p_visitor_hash), hashtext(v_today::text));

  select submission_count into v_count
  from public.submission_limits
  where visitor_hash = p_visitor_hash and quota_date = v_today
  for update;

  if v_count >= p_daily_limit then
    return query select false, 0;
  else
    update public.submission_limits
    set submission_count = submission_count + 1
    where visitor_hash = p_visitor_hash and quota_date = v_today;
    return query select true, greatest(p_daily_limit - v_count - 1, 0);
  end if;
end;
$$;

revoke all on function public.consume_link_quota(text, integer) from public, anon, authenticated;
grant execute on function public.consume_link_quota(text, integer) to service_role;
