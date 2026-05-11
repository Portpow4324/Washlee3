-- Washlee monitoring and privacy-light analytics.
-- These tables are written through server-side API routes using the Supabase
-- service role key. No public insert/read policy is granted by default.

create extension if not exists pgcrypto;

create table if not exists public.analytics_sessions (
  session_id text primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  source text not null default 'web' check (source in ('web', 'ios', 'android')),
  landing_page text,
  referrer text,
  device_type text,
  browser text,
  user_id uuid,
  event_count integer not null default 0,
  safe_metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.analytics_sessions(session_id) on delete cascade,
  user_id uuid,
  event_name text not null,
  source text not null default 'web' check (source in ('web', 'ios', 'android')),
  path text,
  screen text,
  referrer text,
  device_type text,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.monitor_runs (
  id uuid primary key default gen_random_uuid(),
  check_name text not null,
  target text not null,
  status text not null check (status in ('ok', 'warning', 'critical')),
  status_code integer,
  latency_ms integer,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  category text not null,
  title text not null,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_name_created_at on public.analytics_events(event_name, created_at desc);
create index if not exists idx_analytics_events_path_created_at on public.analytics_events(path, created_at desc);
create index if not exists idx_analytics_sessions_last_seen on public.analytics_sessions(last_seen_at desc);
create index if not exists idx_monitor_runs_created_at on public.monitor_runs(created_at desc);
create index if not exists idx_security_alerts_status_created_at on public.security_alerts(status, created_at desc);

create or replace function public.increment_analytics_session_count(p_session_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.analytics_sessions
  set event_count = event_count + 1,
      last_seen_at = now()
  where session_id = p_session_id;
$$;

alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.monitor_runs enable row level security;
alter table public.security_alerts enable row level security;
