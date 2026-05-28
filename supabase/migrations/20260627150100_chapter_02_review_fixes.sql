-- Chapter 2 review fixes (post-deploy delta).
-- Quest 3 profile split: see 20260629120000_chapter_02_q3_split_profiles.sql

update public.game_quest_steps s
set
  content_payload = jsonb_set(
    s.content_payload,
    '{targets,2,correctItemIds}',
    '["f-inizio"]'::jsonb,
    false
  ),
  updated_at = now()
where s.logical_task_key = 'chapter-02-q4-dragdrop-motivation-letter';
