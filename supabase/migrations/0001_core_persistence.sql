-- ROOTMAN MONEY ROUTE — Migration 0001: core persistence
-- Tables: assessment_sessions, score_snapshots, analytics_events
-- Apply via Supabase SQL editor or `supabase db push`.
-- No AI tables (ai_conversations / ai_messages) — deterministic system only.

-- ─────────────────────────────────────────────────────────────
-- assessment_sessions
-- ─────────────────────────────────────────────────────────────
create table if not exists public.assessment_sessions (
  id                    uuid primary key default gen_random_uuid(),
  anonymous_session_id  text,
  user_id               uuid references auth.users (id) on delete set null,
  assessment_version    text not null,
  status                text not null default 'completed'
                          check (status in ('in_progress', 'completed', 'claimed')),
  answers               jsonb not null default '{}'::jsonb,
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  claimed_at            timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists idx_sessions_user
  on public.assessment_sessions (user_id);
create index if not exists idx_sessions_anon
  on public.assessment_sessions (anonymous_session_id);

-- ─────────────────────────────────────────────────────────────
-- score_snapshots (immutable computed result for a session)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.score_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.assessment_sessions (id) on delete cascade,
  scoring_version    text not null,
  assessment_version text,
  dimension_scores   jsonb not null,
  type_scores        jsonb not null,
  route_scores       jsonb not null,
  constraint_flags   jsonb not null default '[]'::jsonb,
  primary_type       text,
  secondary_type     text,
  anti_type          text,
  cashflow_route     text,
  asset_route        text,
  bridge_route       text,
  generated_at       timestamptz not null default now()
);

create index if not exists idx_snapshots_session
  on public.score_snapshots (session_id);

-- ─────────────────────────────────────────────────────────────
-- analytics_events
-- ─────────────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users (id) on delete set null,
  anonymous_id     text,
  event_name       text not null,
  event_properties jsonb not null default '{}'::jsonb,
  occurred_at      timestamptz not null default now()
);

create index if not exists idx_events_name
  on public.analytics_events (event_name);
create index if not exists idx_events_occurred
  on public.analytics_events (occurred_at);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- Server code uses the service role key (bypasses RLS) for anonymous writes.
-- These policies govern authenticated client access for later auth phase.
-- ─────────────────────────────────────────────────────────────
alter table public.assessment_sessions enable row level security;
alter table public.score_snapshots     enable row level security;
alter table public.analytics_events     enable row level security;

-- Users can read/update their own sessions.
create policy "sessions_select_own"
  on public.assessment_sessions for select
  using (auth.uid() = user_id);

create policy "sessions_update_own"
  on public.assessment_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can read snapshots for their own sessions.
create policy "snapshots_select_own"
  on public.score_snapshots for select
  using (
    exists (
      select 1 from public.assessment_sessions s
      where s.id = score_snapshots.session_id
        and s.user_id = auth.uid()
    )
  );

-- Authenticated users can insert their own analytics events.
create policy "events_insert_own"
  on public.analytics_events for insert
  to authenticated
  with check (auth.uid() = user_id);
