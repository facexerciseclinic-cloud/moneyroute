-- ROOTMAN MONEY ROUTE — Migration 0004: experiments (progress tracking)
-- Apply via `node scripts/db-migrate.mjs`.
--
-- Design note: experiment *content* (the 7 daily tasks per income route) is
-- deterministic and lives in code (src/lib/domain/report-content.ts →
-- ROUTE_CONTENT[route].sevenDayExperiment), consistent with reports/routes.
-- Only per-user *state* is persisted here.

-- ─────────────────────────────────────────────────────────────
-- user_experiments — one active 7-day experiment per assessment session.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.user_experiments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  session_id    uuid not null references public.assessment_sessions (id) on delete cascade,
  route_key     text not null,
  status        text not null default 'active'
                  check (status in ('active', 'completed', 'abandoned')),
  current_day   integer not null default 1
                  check (current_day between 1 and 7),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (user_id, session_id)
);

create index if not exists idx_user_experiments_user
  on public.user_experiments (user_id);

-- ─────────────────────────────────────────────────────────────
-- task_completions — one row per completed day of an experiment.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.task_completions (
  id                 uuid primary key default gen_random_uuid(),
  user_experiment_id uuid not null references public.user_experiments (id) on delete cascade,
  day_number         integer not null check (day_number between 1 and 7),
  evidence_text      text,
  completed_at       timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  unique (user_experiment_id, day_number)
);

create index if not exists idx_task_completions_experiment
  on public.task_completions (user_experiment_id);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security. Server writes use the service role (bypasses RLS);
-- these policies let a user read only their own progress.
-- ─────────────────────────────────────────────────────────────
alter table public.user_experiments enable row level security;
alter table public.task_completions enable row level security;

create policy "user_experiments_select_own"
  on public.user_experiments for select
  using (auth.uid() = user_id);

create policy "task_completions_select_own"
  on public.task_completions for select
  using (
    exists (
      select 1 from public.user_experiments ue
      where ue.id = task_completions.user_experiment_id
        and ue.user_id = auth.uid()
    )
  );
