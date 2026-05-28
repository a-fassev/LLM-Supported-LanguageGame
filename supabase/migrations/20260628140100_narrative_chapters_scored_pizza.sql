-- Enable partial pizza slices for narrative chapter task steps (chapters 01–03).
-- Converts flat pizza rules to scored linear mapping; maxSlices = former flat value.

update public.game_quest_steps s
set
  reward_rules = jsonb_set(
    coalesce(s.reward_rules, '{}'::jsonb),
    '{pizza}',
    jsonb_build_object(
      'mode', 'scored',
      'maxSlices', greatest(1, least(5, coalesce((s.reward_rules->'pizza'->>'value')::int, 2))),
      'minRatioToComplete', 0,
      'rounding', 'floor',
      'mapping', jsonb_build_object('kind', 'linear')
    ),
    true
  ),
  updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where q.id = s.quest_id
  and c.slug in ('chapter-01', 'chapter-02', 'chapter-03')
  and s.step_kind = 'task'
  and coalesce(s.task_type, '') not in ('FreitextLlm')
  and coalesce(s.reward_rules->'pizza'->>'mode', '') = 'flat';

-- FreitextLlm in narrative chapters: scored pizza from evaluation ratio.
update public.game_quest_steps s
set
  reward_rules = jsonb_set(
    coalesce(s.reward_rules, '{}'::jsonb),
    '{pizza}',
    jsonb_build_object(
      'mode', 'scored',
      'maxSlices', greatest(1, least(5, coalesce((s.reward_rules->'pizza'->>'value')::int, 2))),
      'minRatioToComplete', 0,
      'rounding', 'floor',
      'mapping', jsonb_build_object('kind', 'linear')
    ),
    true
  ),
  updated_at = now()
from public.game_quests q
join public.game_chapters c on c.id = q.chapter_id
where q.id = s.quest_id
  and c.slug in ('chapter-01', 'chapter-02', 'chapter-03')
  and s.step_kind = 'task'
  and s.task_type = 'FreitextLlm'
  and coalesce(s.reward_rules->'pizza'->>'mode', '') = 'flat';
