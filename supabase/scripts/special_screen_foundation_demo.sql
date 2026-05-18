-- Inserts a Special Screen foundation demo task for quest-01 immediately after FreitextLlm demo (`quest-01-freitext-llm-demo`).
-- Safe to re-run: skips when logical_task_key `quest-01-special-screen-foundation-demo` already exists.

do $$
declare
  v_quest_id uuid;
  v_anchor_order int;
  v_ins_order int;
  v_exists boolean;
  v_bump int;
begin
  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
    and is_active = true
  limit 1;

  if v_quest_id is null then
    raise notice 'special_screen_foundation_demo: quest-01 not found; skipping';
    return;
  end if;

  select exists (
    select 1
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-special-screen-foundation-demo'
  )
  into v_exists;

  if v_exists then
    raise notice 'special_screen_foundation_demo: quest-01-special-screen-foundation-demo already present; skipping';
    return;
  end if;

  select s.order_index
  into v_anchor_order
  from public.game_quest_steps s
  where s.quest_id = v_quest_id
    and s.logical_task_key = 'quest-01-freitext-llm-demo'
    and s.is_active = true
  limit 1;

  if v_anchor_order is null then
    raise notice 'special_screen_foundation_demo: quest-01-freitext-llm-demo not found; skipping';
    return;
  end if;

  v_ins_order := v_anchor_order + 1;

  select coalesce(max(s.order_index), 0) + 10000
  into v_bump
  from public.game_quest_steps s
  where s.quest_id = v_quest_id;

  update public.game_quest_steps
  set
    order_index = order_index + v_bump,
    updated_at = now()
  where quest_id = v_quest_id
    and order_index >= v_ins_order;

  update public.game_quest_steps
  set
    order_index = order_index - v_bump + 1,
    updated_at = now()
  where quest_id = v_quest_id
    and order_index >= v_ins_order + v_bump;

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
  values (
    v_quest_id,
    v_ins_order,
    'task',
    'SpecialScreen',
    'task.special-screen.foundation',
    'quest-01-special-screen-foundation-demo',
    $payload${
      "screenVariant": "generic",
      "title": "Demo schermata speciale",
      "subtitle": "Usa «→» tra le parti, poi «Controlla».",
      "blocks": [
        {
          "blockType": "cloze_text",
          "clozeText": {
            "prompt": "Completa.",
            "caseSensitive": false,
            "lines": [
              {
                "segments": [
                  { "kind": "text", "text": "Mi chiamo " },
                  { "kind": "gap", "correctAnswers": ["Anna"], "maxLength": 24 }
                ]
              }
            ]
          }
        },
        {
          "blockType": "stub",
          "stub": {
            "headline": "Cornice segnaposto",
            "body": "Qui arriveranno cornici SMS / mail / lettore."
          }
        },
        {
          "blockType": "error_spotting",
          "errorSpotting": {
            "prompt": "Correggi.",
            "instruction": "Seleziona l'errore e scrivi la forma corretta.",
            "expectedErrorRange": { "min": 1, "max": 1 },
            "segments": [
              { "id": "e1", "text": "Buongiorno ", "isError": false },
              {
                "id": "e2",
                "text": "buono",
                "isError": true,
                "acceptedCorrections": ["Buono"]
              }
            ]
          }
        }
      ]
    }$payload$::jsonb,
    '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb,
    true
  );
end $$;
