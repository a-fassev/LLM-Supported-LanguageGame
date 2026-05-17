-- Inserts a small DragDrop test task in quest-01 immediately after the ClozeText step (order_index 2),
-- bumping the former outro cutscene to order_index 4. Safe to re-run: skips if quest-01-task-03 exists.

do $$
declare
  v_quest_id uuid;
  v_exists boolean;
begin
  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
  limit 1;

  if v_quest_id is null then
    raise notice 'quest01_dragdrop_after_cloze: quest-01 not found; skipping';
    return;
  end if;

  select exists (
    select 1
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-task-03'
  )
  into v_exists;

  if v_exists then
    return;
  end if;

  update public.game_quest_steps
  set
    order_index = order_index + 1,
    updated_at = now()
  where quest_id = v_quest_id
    and order_index >= 3;

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
    3,
    'task',
    'DragDrop',
    'task.drag-drop',
    'quest-01-task-03',
    $droppayload$
    {
      "prompt": "Trascina le parole nelle categorie.",
      "subtitle": "",
      "shuffleItemOrder": true,
      "requireBankEmpty": true,
      "items": [
        { "id": "item-animale", "label": "il gatto", "imageUrl": "" },
        { "id": "item-cibo", "label": "la mela", "imageUrl": "" }
      ],
      "targets": [
        { "id": "t-animali", "title": "Animali", "correctItemIds": ["item-animale"] },
        { "id": "t-cibo", "title": "Cibo", "correctItemIds": ["item-cibo"] }
      ],
      "presentation": {
        "targetMode": "blocks",
        "sourceLabel": "Parole",
        "targetLabel": "Categorie"
      }
    }
    $droppayload$::jsonb,
    '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb,
    true
  );
end $$;
