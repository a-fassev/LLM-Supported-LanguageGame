-- Inserts a Matching demo task for quest-01 immediately after the MultipleChoice demo
-- identified by logical_task_key = 'quest-01-multiple-choice-demo'.
-- Bumps later steps by +1. Safe to re-run: skips if logical_task_key 'quest-01-matching-demo' already exists.

do $$
declare
  v_quest_id uuid;
  v_mc_order int;
  v_ins_order int;
  v_exists boolean;
begin
  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
    and is_active = true
  limit 1;

  if v_quest_id is null then
    raise notice 'quest01_matching: quest-01 not found; skipping';
    return;
  end if;

  select exists (
    select 1
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-matching-demo'
  )
  into v_exists;

  if v_exists then
    raise notice 'quest01_matching: quest-01-matching-demo already present; skipping';
    return;
  end if;

  select s.order_index
  into v_mc_order
  from public.game_quest_steps s
  where s.quest_id = v_quest_id
    and s.logical_task_key = 'quest-01-multiple-choice-demo'
    and s.is_active = true
  limit 1;

  if v_mc_order is null then
    raise notice 'quest01_matching: quest-01-multiple-choice-demo not found; skipping';
    return;
  end if;

  v_ins_order := v_mc_order + 1;

  update public.game_quest_steps
  set
    order_index = order_index + 1,
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
    'Matching',
    'task.matching',
    'quest-01-matching-demo',
    $match${
  "prompt": "Abbina i saluti",
  "subtitle": "Trascina una linea dalla colonna A alla B, oppure tocca a sinistra e poi a destra.",
  "leftItems": [
    { "id": "l1", "label": "Buongiorno" },
    { "id": "l2", "label": "Grazie" },
    { "id": "l3", "label": "Arrivederci" }
  ],
  "rightItems": [
    { "id": "r1", "label": "Mattina / incontro" },
    { "id": "r2", "label": "Ringraziamento" },
    { "id": "r3", "label": "Saluto quando si parte" },
    { "id": "r4", "label": "Dopo cena (distrazione)" }
  ],
  "correctPairs": [
    { "leftItemId": "l1", "rightItemId": "r1" },
    { "leftItemId": "l2", "rightItemId": "r2" },
    { "leftItemId": "l3", "rightItemId": "r3" }
  ],
  "presentation": {
    "leftLabel": "Italiano",
    "rightLabel": "Significato",
    "shuffleRightOrder": true
  }
}$match$::jsonb,
    '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb,
    true
  );
end $$;
