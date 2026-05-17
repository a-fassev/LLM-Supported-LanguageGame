-- Idempotent content refresh for ClozeText steps. Use this on databases that already
-- applied 20260518140000_* with prompt-only payloads; greenfield seed may already include
-- full JSON for new installs — running this UPDATE again is safe.
--
-- When no row matches a WHERE clause (empty DB, different logical_task_key, or keys already updated), that
-- UPDATE affects 0 rows — expected and not an error.
--
-- Ops: On forks or manual DBs, confirm rows exist before relying on updates, e.g.:
--   select logical_task_key, task_type from public.game_quest_steps where task_type = 'ClozeText';
-- If logical_task_key values differ from quest-01-task-02 / quest-04-task-01, adjust the
-- WHERE clauses or seed data first; otherwise these statements affect 0 rows with no error.

update public.game_quest_steps
set
  content_payload =
    '{"prompt":"Completa il testo.","lines":[{"segments":[{"kind":"text","text":"Il gatto "},{"kind":"gap","placeholder":"…","maxLength":16,"correctAnswers":["mangia"]},{"kind":"text","text":" il topo."}]}]}'::jsonb,
  updated_at = now()
where
  task_type = 'ClozeText'
  and logical_task_key = 'quest-01-task-02';

update public.game_quest_steps
set
  content_payload =
    '{"prompt":"Riempi gli spazi.","lines":[{"segments":[{"kind":"text","text":"Ciao, mi chiamo "},{"kind":"gap","placeholder":"…","maxLength":24,"correctAnswers":["Marco","MARCO"]},{"kind":"text","text":"."}]}]}'::jsonb,
  updated_at = now()
where
  task_type = 'ClozeText'
  and logical_task_key = 'quest-04-task-01';
