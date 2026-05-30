-- ============================================================
-- Flag Arcade — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. PROFILES
-- Auto-created when a user signs up via the trigger below.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can view profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Player'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. USER PROGRESS
-- One row per user. Stores full journey progress + settings as JSONB.
create table public.user_progress (
  id uuid primary key references public.profiles(id) on delete cascade,
  journey_progress jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

create policy "Users can view own progress"
  on public.user_progress for select
  using (auth.uid() = id);

create policy "Users can insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = id);

create policy "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = id);


-- 3. LEADERBOARD SCORES (all-time)
-- One row per user per mode. Updated on personal best.
create table public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('journey', 'campaign', 'jeopardy', 'around_the_world')),
  score integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  achieved_at timestamptz not null default now(),

  unique (user_id, mode)
);

alter table public.leaderboard_scores enable row level security;

create policy "Anyone can view leaderboard"
  on public.leaderboard_scores for select
  using (true);

create policy "Users can insert own scores"
  on public.leaderboard_scores for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scores"
  on public.leaderboard_scores for update
  using (auth.uid() = user_id);

-- Index for fast leaderboard queries
create index idx_leaderboard_mode_score
  on public.leaderboard_scores (mode, score desc);


-- 4. LEADERBOARD MONTHLY
-- Same structure plus a month column. Truncated on the 1st of each month.
create table public.leaderboard_monthly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('journey', 'campaign', 'jeopardy', 'around_the_world')),
  score integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  achieved_at timestamptz not null default now(),
  month date not null default date_trunc('month', now())::date,

  unique (user_id, mode, month)
);

alter table public.leaderboard_monthly enable row level security;

create policy "Anyone can view monthly leaderboard"
  on public.leaderboard_monthly for select
  using (true);

create policy "Users can insert own monthly scores"
  on public.leaderboard_monthly for insert
  with check (auth.uid() = user_id);

create policy "Users can update own monthly scores"
  on public.leaderboard_monthly for update
  using (auth.uid() = user_id);

-- Index for fast monthly leaderboard queries
create index idx_leaderboard_monthly_mode_month_score
  on public.leaderboard_monthly (mode, month, score desc);


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get top N for a mode (all-time)
create or replace function public.get_leaderboard(
  p_mode text,
  p_limit integer default 100
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  score integer,
  metadata jsonb,
  achieved_at timestamptz
)
language sql
stable
as $$
  select
    row_number() over (order by ls.score desc) as rank,
    ls.user_id,
    p.display_name,
    p.avatar_url,
    ls.score,
    ls.metadata,
    ls.achieved_at
  from public.leaderboard_scores ls
  join public.profiles p on p.id = ls.user_id
  where ls.mode = p_mode
  order by ls.score desc
  limit p_limit;
$$;

-- Get top N for a mode (monthly)
create or replace function public.get_monthly_leaderboard(
  p_mode text,
  p_month date default date_trunc('month', now())::date,
  p_limit integer default 100
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  score integer,
  metadata jsonb,
  achieved_at timestamptz
)
language sql
stable
as $$
  select
    row_number() over (order by lm.score desc) as rank,
    lm.user_id,
    p.display_name,
    p.avatar_url,
    lm.score,
    lm.metadata,
    lm.achieved_at
  from public.leaderboard_monthly lm
  join public.profiles p on p.id = lm.user_id
  where lm.mode = p_mode and lm.month = p_month
  order by lm.score desc
  limit p_limit;
$$;

-- ============================================================
-- 5. CRM PROSPECTS (admin-only)
-- ============================================================
-- Backs the /admin dashboard's status board (new / emailed / replied /
-- linked / dead) and free-form notes per prospect URL. Accessed only via
-- the /api/state serverless function using the service role key. RLS is
-- enabled with no public policies so a leaked anon key can't read it.

create table public.crm_prospects (
  url text primary key,
  status text not null default '',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.crm_prospects enable row level security;
-- Intentionally no policies — only the server-side service role key reads
-- and writes this table, and the service role bypasses RLS.


-- Get a user's rank for a mode (all-time)
create or replace function public.get_user_rank(
  p_user_id uuid,
  p_mode text
)
returns bigint
language sql
stable
as $$
  select count(*) + 1
  from public.leaderboard_scores
  where mode = p_mode
    and score > (
      select coalesce(score, 0)
      from public.leaderboard_scores
      where user_id = p_user_id and mode = p_mode
    );
$$;


-- ============================================================
-- 6. PLAY SESSIONS (usage analytics)
-- ============================================================
-- One row per gameplay session (start → end). Players are mostly anonymous,
-- so "unique players" is keyed on an anonymous device_id (a UUID kept in the
-- client's localStorage); user_id is attached opportunistically when signed in.
-- Written and read only via the /api/track and /api/analytics serverless
-- functions using the service role key. RLS is enabled with no policies so a
-- leaked anon key can neither read nor forge rows.

create table public.play_sessions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  mode text not null check (mode in ('journey', 'arcade', 'around_the_world', 'jeopardy', 'flag_runner')),
  platform text not null default 'web' check (platform in ('web', 'ios', 'android')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms integer,
  completed boolean not null default false,
  score integer,
  correct integer,
  total integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.play_sessions enable row level security;
-- Intentionally no policies — only the server-side service role key reads and
-- writes this table, and the service role bypasses RLS.

create index idx_play_sessions_started on public.play_sessions (started_at desc);
create index idx_play_sessions_mode_started on public.play_sessions (mode, started_at desc);
create index idx_play_sessions_device on public.play_sessions (device_id);


-- Per-mode rollup since a given timestamp (powers the dashboard table).
create or replace function public.get_play_summary(p_since timestamptz)
returns table (
  mode text,
  plays bigint,
  unique_players bigint,
  completed_plays bigint,
  total_duration_ms bigint,
  avg_duration_ms bigint
)
language sql
stable
as $$
  select
    ps.mode,
    count(*) as plays,
    count(distinct ps.device_id) as unique_players,
    count(*) filter (where ps.completed) as completed_plays,
    coalesce(sum(ps.duration_ms), 0)::bigint as total_duration_ms,
    coalesce(round(avg(ps.duration_ms)), 0)::bigint as avg_duration_ms
  from public.play_sessions ps
  where ps.started_at >= p_since
  group by ps.mode
  order by plays desc;
$$;

-- Daily counts since a given timestamp (powers the dashboard chart).
create or replace function public.get_play_timeseries(p_since timestamptz)
returns table (
  day date,
  plays bigint,
  unique_players bigint
)
language sql
stable
as $$
  select
    (ps.started_at at time zone 'UTC')::date as day,
    count(*) as plays,
    count(distinct ps.device_id) as unique_players
  from public.play_sessions ps
  where ps.started_at >= p_since
  group by day
  order by day;
$$;

-- Scalar totals across all modes since a given timestamp (powers the cards).
create or replace function public.get_play_totals(p_since timestamptz)
returns table (
  plays bigint,
  unique_players bigint,
  completed_plays bigint,
  total_duration_ms bigint
)
language sql
stable
as $$
  select
    count(*) as plays,
    count(distinct ps.device_id) as unique_players,
    count(*) filter (where ps.completed) as completed_plays,
    coalesce(sum(ps.duration_ms), 0)::bigint as total_duration_ms
  from public.play_sessions ps
  where ps.started_at >= p_since;
$$;
