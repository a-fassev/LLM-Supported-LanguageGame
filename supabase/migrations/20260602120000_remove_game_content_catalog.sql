-- Remove Supabase-hosted game content catalog; keep auth + wallet progress.

TRUNCATE TABLE
  public.player_freitext_llm_gates,
  public.player_step_materializations,
  public.player_step_attempts,
  public.player_quest_runs
RESTART IDENTITY CASCADE;

DROP FUNCTION IF EXISTS public.complete_quest_step_task(uuid, uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.advance_quest_cutscene_step(uuid, uuid, uuid);

ALTER TABLE public.player_step_attempts
  DROP CONSTRAINT IF EXISTS player_step_attempts_step_id_fkey;

ALTER TABLE public.player_step_materializations
  DROP CONSTRAINT IF EXISTS player_step_materializations_step_id_fkey;

ALTER TABLE public.player_quest_runs
  DROP CONSTRAINT IF EXISTS player_quest_runs_chapter_id_fkey;

ALTER TABLE public.player_quest_runs
  DROP CONSTRAINT IF EXISTS player_quest_runs_quest_id_fkey;

DROP TABLE IF EXISTS public.game_quest_steps CASCADE;
DROP TABLE IF EXISTS public.game_quests CASCADE;
DROP TABLE IF EXISTS public.game_chapters CASCADE;

DROP TABLE IF EXISTS public._agent_migration_staging;
