-- Raise minRatioToComplete from 0 to 0.01 so learners cannot complete at 0% performance.
-- Partial slices still apply via linear mapping when ratio >= 0.01.

update public.game_quest_steps s
set
  reward_rules = jsonb_set(
    coalesce(s.reward_rules, '{}'::jsonb),
    '{pizza,minRatioToComplete}',
    '0.01'::jsonb,
    true
  ),
  updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where q.id = s.quest_id
  and c.slug in ('chapter-01', 'chapter-02', 'chapter-03')
  and s.step_kind = 'task'
  and coalesce(s.reward_rules->'pizza'->>'mode', '') = 'scored'
  and coalesce((s.reward_rules->'pizza'->>'minRatioToComplete')::numeric, 1) = 0;
