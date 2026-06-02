-- Greenfield run persistence for file-based chapter/quest/scene catalog.
-- Keeps auth/session and wallet tables; does not reintroduce content catalog tables in Postgres.

DROP TABLE IF EXISTS public.player_step_attempts CASCADE;
DROP TABLE IF EXISTS public.player_step_materializations CASCADE;
DROP TABLE IF EXISTS public.player_freitext_llm_gates CASCADE;
DROP TABLE IF EXISTS public.player_task_attempts CASCADE;
DROP TABLE IF EXISTS public.player_scene_completions CASCADE;
DROP TABLE IF EXISTS public.player_quest_runs CASCADE;

CREATE TABLE public.player_quest_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.student_accounts(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  quest_id text NOT NULL,
  current_scene_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE UNIQUE INDEX player_quest_runs_one_active_per_account_idx
  ON public.player_quest_runs (account_id)
  WHERE status = 'in_progress';

CREATE INDEX player_quest_runs_account_status_idx
  ON public.player_quest_runs (account_id, status, updated_at DESC);

CREATE TABLE public.player_scene_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.player_quest_runs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.student_accounts(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  quest_id text NOT NULL,
  scene_id text NOT NULL,
  scene_type text NOT NULL CHECK (scene_type IN ('story', 'task')),
  task_type text,
  awarded_slices int NOT NULL DEFAULT 0 CHECK (awarded_slices >= 0 AND awarded_slices <= 5),
  awarded_backpack_pieces int NOT NULL DEFAULT 0 CHECK (awarded_backpack_pieces >= 0),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, scene_id)
);

CREATE INDEX player_scene_completions_account_idx
  ON public.player_scene_completions (account_id, completed_at DESC);

CREATE TABLE public.player_task_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id uuid NOT NULL REFERENCES public.player_scene_completions(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES public.player_quest_runs(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.student_accounts(id) ON DELETE CASCADE,
  scene_id text NOT NULL,
  task_type text NOT NULL,
  attempt_payload jsonb,
  ratio numeric(6,5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (completion_id)
);

CREATE INDEX player_task_attempts_run_idx
  ON public.player_task_attempts (run_id, created_at DESC);
