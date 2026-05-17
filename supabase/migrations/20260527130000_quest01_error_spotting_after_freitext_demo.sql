-- ErrorSpotting demo for quest-01: insert after FreitextLlm demo (`quest-01-freitext-llm-demo`), bump indexes.
-- Also upgrades legacy minimal row `quest-01-task-01` to structured content (first ErrorSpotting in greenfield seed).
-- Idempotent: skips insert when logical_task_key exists; UPDATE on legacy rows is safe.

do $$
declare
  v_quest_id uuid;
  v_after_order integer;
  v_ins_order integer;
  v_demo_exists boolean;
begin
  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
    and is_active = true
  limit 1;

  if v_quest_id is null then
    raise notice 'quest01_error_spotting: quest-01 not found; skipping';
    return;
  end if;

  raise notice 'quest01_error_spotting: patching legacy quest-01-task-01 payload';
  update public.game_quest_steps
  set
    content_payload = $legacy${
      "prompt": "Trova l'errore",
      "instruction": "Tocca il verbo sbagliato e scrivi la forma corretta.",
      "expectedErrorRange": { "min": 1, "max": 1 },
      "segments": [
        { "id": "a", "text": "Maria ", "isError": false },
        { "id": "b", "text": "vai ", "isError": true, "acceptedCorrections": [ "va" ] },
        { "id": "c", "text": "a scuola ogni giorno.", "isError": false }
      ]
    }$legacy$::jsonb,
    updated_at = now()
  where logical_task_key = 'quest-01-task-01'
    and task_type = 'ErrorSpotting'
    and quest_id = v_quest_id
    and is_active = true;

  select exists (
      select 1
      from public.game_quest_steps s
      where s.quest_id = v_quest_id
        and s.logical_task_key = 'quest-01-error-spotting-demo'
    )
    into v_demo_exists;

  if v_demo_exists then
    raise notice 'quest01_error_spotting: quest-01-error-spotting-demo already present; skipping insert';
    return;
  end if;

  -- Prefer inserting after FreitextLlm demo when present (authoring flow in repo scripts).
  select s.order_index
  into v_after_order
  from public.game_quest_steps s
  where s.quest_id = v_quest_id
    and s.logical_task_key = 'quest-01-freitext-llm-demo'
    and s.is_active = true
  limit 1;

  if v_after_order is null then
    select s.order_index
    into v_after_order
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-matching-demo'
      and s.is_active = true
    limit 1;
  end if;

  if v_after_order is null then
    select max(s.order_index)
    into v_after_order
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.is_active = true;
  end if;

  if v_after_order is null then
    raise notice 'quest01_error_spotting: quest-01 has no steps; skipping insert';
    return;
  end if;

  v_ins_order := v_after_order + 1;

  update public.game_quest_steps
  set order_index = order_index + 1,
      updated_at = now()
  where quest_id = v_quest_id
    and order_index >= v_ins_order;

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
    'ErrorSpotting',
    'task.error-spotting.demo',
    'quest-01-error-spotting-demo',
    $body${
      "prompt": "Trova gli errori e correggili.",
      "instruction": "Seleziona ogni errore nella frase qui sotto, poi scrivi la forma corretta in italiano.",
      "expectedErrorRange": { "min": 5, "max": 5 },
      "segments": [
        { "id": "s1", "text": "Vado ", "isError": false },
        { "id": "s2", "text": "al ", "isError": false },
        { "id": "s3", "text": "supermercato ", "isError": false },
        { "id": "s4", "text": "ogni ", "isError": false },
        {
          "id": "s5",
          "text": "domenicha",
          "isError": true,
          "acceptedCorrections": [ "domenica" ]
        },
        { "id": "s6", "text": ". ", "isError": false },

        { "id": "s7", "text": "Ho ", "isError": false },
        {
          "id": "s8",
          "text": "comprati ",
          "isError": true,
          "acceptedCorrections": [ "comprato" ]
        },
        { "id": "s9", "text": "molti ", "isError": false },
        {
          "id": "s10",
          "text": "libro",
          "isError": true,
          "acceptedCorrections": [ "libri" ]
        },
        { "id": "s11", "text": ". ", "isError": false },

        { "id": "s12", "text": "Mi ", "isError": false },
        { "id": "s13", "text": "piace ", "isError": false },
        {
          "id": "s14",
          "text": "il ",
          "isError": true,
          "acceptedCorrections": [ "la" ]
        },
        { "id": "s15", "text": "pizza ", "isError": false },
        {
          "id": "s16",
          "text": "perque ",
          "isError": true,
          "acceptedCorrections": [ "perché", "perche", "percé", "percè" ]
        },
        { "id": "s17", "text": "è ", "isError": false },
        { "id": "s18", "text": "buono", "isError": false },
        { "id": "s19", "text": ".", "isError": false }
      ]
    }$body$::jsonb,
    '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb,
    true
  );
end $$;
