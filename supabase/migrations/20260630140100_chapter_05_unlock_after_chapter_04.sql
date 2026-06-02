-- Chapter 5 quest 1 must unlock after the last main Chapter 4 quest (Comacchio), not the old piazza quiz.

update public.game_quests q
set
  unlock_rules = jsonb_set(
    coalesce(q.unlock_rules, '{}'::jsonb),
    '{prerequisiteQuestSlugs}',
    '["chapter-04-quest-04-comacchio"]'::jsonb
  ),
  updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and c.slug = 'chapter-05'
  and q.slug = 'chapter-05-quest-01-week-bridge';
