-- One-time pilot cleanup: chapter-00 was rewritten from team sandbox to learner tutorial.
-- In-progress runs on old scene ids cannot resume; abandon so players can start fresh.
UPDATE public.player_quest_runs
SET
  status = 'abandoned',
  updated_at = now()
WHERE status = 'in_progress'
  AND chapter_id = 'chapter-00';
