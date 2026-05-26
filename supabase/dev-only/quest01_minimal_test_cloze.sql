-- DEV / MANUAL ONLY — not executed by `supabase db migrate`.
-- Wipes quest-01 (chapter-01) steps and related runs/attempts, then inserts a minimal
-- intro + single ClozeText task. Do not run against shared or production databases.

-- Quest 1 (chapter-01 / quest-01): only intro cutscene + one ClozeText test task.
-- Deletes all other steps for this quest and clears runs / attempts so clients see a clean quest.

with target as (
  select q.id as quest_id
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where q.slug = 'quest-01'
    and c.slug = 'chapter-01'
),
step_ids as (
  select s.id as step_id
  from public.game_quest_steps s
  join target t on t.quest_id = s.quest_id
)
delete from public.player_step_attempts psa
using step_ids si
where psa.step_id = si.step_id;

with target as (
  select q.id as quest_id
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where q.slug = 'quest-01'
    and c.slug = 'chapter-01'
)
delete from public.player_quest_runs pqr
using target t
where pqr.quest_id = t.quest_id;

with target as (
  select q.id as quest_id
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where q.slug = 'quest-01'
    and c.slug = 'chapter-01'
)
delete from public.game_quest_steps s
using target t
where s.quest_id = t.quest_id;

insert into public.game_quest_steps (
  quest_id,
  order_index,
  step_kind,
  task_type,
  template_key,
  logical_task_key,
  content_payload,
  reward_rules,
  is_active
)
select
  t.quest_id,
  0,
  'cutscene',
  null,
  'cutscene.intro',
  null,
  jsonb_build_object(
    'beats',
    jsonb_build_array(
      jsonb_build_object(
        'presentationMode', 'narrator',
        'title', 'Benvenuto',
        'body', 'Un breve testo: dopo questa schermata c''è un compito.'
      )
    )
  ),
  '{}'::jsonb,
  true
from (
  select q.id as quest_id
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where q.slug = 'quest-01'
    and c.slug = 'chapter-01'
) t;

insert into public.game_quest_steps (
  quest_id,
  order_index,
  step_kind,
  task_type,
  template_key,
  logical_task_key,
  content_payload,
  reward_rules,
  is_active
)
select
  t.quest_id,
  1,
  'task',
  'ClozeText',
  'task.cloze-text',
  'quest-01-test-cloze',
  jsonb_build_object(
    'prompt', 'Completa la frase.',
    'lines', jsonb_build_array(
      jsonb_build_object(
        'segments', jsonb_build_array(
          jsonb_build_object('kind', 'text', 'text', 'Uno, due, '),
          jsonb_build_object(
            'kind', 'gap',
            'placeholder', '?',
            'maxLength', 12,
            'correctAnswers', jsonb_build_array('tre')
          ),
          jsonb_build_object('kind', 'text', 'text', '.')
        )
      )
    )
  ),
  jsonb_build_object(
    'pizza', jsonb_build_object('mode', 'flat', 'value', 1),
    'backpack', jsonb_build_object('mode', 'first_completion', 'value', 1)
  ),
  true
from (
  select q.id as quest_id
  from public.game_quests q
  join public.game_chapters c on c.id = q.chapter_id
  where q.slug = 'quest-01'
    and c.slug = 'chapter-01'
) t;

update public.game_quests q
set updated_at = now()
from public.game_chapters c
where q.chapter_id = c.id
  and q.slug = 'quest-01'
  and c.slug = 'chapter-01';
