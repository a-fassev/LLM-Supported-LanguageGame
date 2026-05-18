-- Switch quest-01 authoring tasks to server-scored pizza so partial integer slices are testable.
-- minRatioToComplete 0 still requires a syntactically valid attempt payload from Unity for scored mode.

do $$
declare
  v_quest_id uuid;
begin
  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
  limit 1;

  if v_quest_id is null then
    raise notice 'quest01_pizza_scored: quest-01 not found; skipping';
    return;
  end if;

  update public.game_quest_steps s
  set
    reward_rules = jsonb_set(
      coalesce(s.reward_rules, '{}'::jsonb),
      '{pizza}',
      jsonb_build_object(
        'mode', 'scored',
        'maxSlices', 5,
        'minRatioToComplete', 0,
        'rounding', 'floor',
        'mapping', jsonb_build_object('kind', 'linear')
      ),
      true
    ),
    updated_at = now()
  where s.quest_id = v_quest_id
    and s.step_kind = 'task'
    and coalesce(s.task_type, '') not in ('FreitextLlm');
end
$$;

-- Freitext demo: scored pizza mapped from LLM ratio (still gated by passThreshold in content).
update public.game_quest_steps s
set
  reward_rules = jsonb_set(
    coalesce(s.reward_rules, '{}'::jsonb),
    '{pizza}',
    jsonb_build_object(
      'mode', 'scored',
      'maxSlices', 5,
      'minRatioToComplete', 0,
      'rounding', 'floor',
      'mapping', jsonb_build_object('kind', 'linear')
    ),
    true
  ),
  updated_at = now()
from public.game_quests q
where q.id = s.quest_id
  and q.slug = 'quest-01'
  and s.step_kind = 'task'
  and s.task_type = 'FreitextLlm';
