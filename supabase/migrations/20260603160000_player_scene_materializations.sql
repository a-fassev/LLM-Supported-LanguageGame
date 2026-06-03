-- Persist server-materialized task payloads per run/scene (e.g. matching pool sampling).
-- Apply in all environments before deploying matching-pool / bonus quest features.

CREATE TABLE public.player_scene_materializations (
  run_id uuid NOT NULL REFERENCES public.player_quest_runs(id) ON DELETE CASCADE,
  scene_id text NOT NULL,
  materialized_task jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, scene_id)
);

CREATE INDEX player_scene_materializations_run_idx
  ON public.player_scene_materializations (run_id);
