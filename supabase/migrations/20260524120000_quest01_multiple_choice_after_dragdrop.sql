-- Demo Multiple-Choice step for quest-01, placed after Drag-and-Drop (order_index 3 → new step at 4).
-- Idempotent: re-run updates copy and rewards if the row already exists.

insert into public.game_quest_steps (
  quest_id,
  order_index,
  step_kind,
  task_type,
  template_key,
  logical_task_key,
  content_payload,
  reward_rules,
  updated_at
)
select
  q.id,
  4,
  'task',
  'MultipleChoice',
  'task.multiple-choice',
  'quest-01-multiple-choice-demo',
  $mc${
  "prompt": "Saluti",
  "subtitle": "Scegli la risposta migliore, poi premi Check.",
  "stem": [
    { "kind": "text", "text": "È mattina e incontri l'insegnante in classe. Cosa dici?" }
  ],
  "options": [
    { "id": "a", "label": "Buongiorno!" },
    { "id": "b", "label": "Buonanotte!" },
    { "id": "c", "label": "A dopo!" },
    { "id": "d", "label": "Arrivederci!" }
  ],
  "correctOptionIds": ["a"]
}$mc$::jsonb,
  '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb,
  now()
from public.game_quests q
where q.slug = 'quest-01' and q.is_active = true
limit 1
on conflict (quest_id, order_index) do update set
  step_kind = excluded.step_kind,
  task_type = excluded.task_type,
  template_key = excluded.template_key,
  logical_task_key = excluded.logical_task_key,
  content_payload = excluded.content_payload,
  reward_rules = excluded.reward_rules,
  updated_at = now();
