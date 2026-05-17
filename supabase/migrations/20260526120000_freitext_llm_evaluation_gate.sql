-- One-time evaluation gate tokens for FreitextLlm tasks: server verifies a successful LLM pass
-- before allowing complete_quest_step_task (see apps/web route handler).
-- Rows are keyed by active run + step so re-evaluation rotates the gate id/token.

create table if not exists public.player_freitext_llm_gates (
  id uuid primary key default gen_random_uuid (),
  account_id uuid not null references public.student_accounts (id) on delete cascade,
  run_id uuid not null references public.player_quest_runs (id) on delete cascade,
  step_id uuid not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now ()
);

comment on table public.player_freitext_llm_gates is
'Gates progression for FreitextLlm: issued after passing LLM evaluation; consumed on task completion RPC.';

create unique index if not exists player_freitext_llm_gates_run_step_uniq on public.player_freitext_llm_gates (
  run_id,
  step_id
);

create index if not exists player_freitext_llm_gates_account_run_idx on public.player_freitext_llm_gates (
  account_id,
  run_id
);

alter table public.player_freitext_llm_gates enable row level security;
