-- Stores run-scoped materialized step payloads (e.g., sampled matching pairs).
-- One row per run + step, immutable for the run lifecycle.

create table if not exists public.player_step_materializations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.student_accounts(id) on delete cascade,
  run_id uuid not null references public.player_quest_runs(id) on delete cascade,
  step_id uuid not null references public.game_quest_steps(id) on delete cascade,
  materialized_content_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_step_materializations_unique_run_step unique (run_id, step_id)
);

create index if not exists player_step_materializations_account_run_idx
  on public.player_step_materializations (account_id, run_id);

create index if not exists player_step_materializations_run_idx
  on public.player_step_materializations (run_id);

alter table public.player_step_materializations enable row level security;

revoke all on public.player_step_materializations from anon, authenticated;
grant select, insert, update, delete on public.player_step_materializations to service_role;
