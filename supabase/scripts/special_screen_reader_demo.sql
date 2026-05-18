-- Reader (magazine / book excerpt) Special Screen demo for quest-01.
-- task_type: SpecialScreenReader | display-only (empty blocks) | readerChrome drives layout.
-- Anchor for first insert: after quest-01-special-screen-sms-whatsapp-demo if present, else quest-01-special-screen-foundation-demo, else quest-01-freitext-llm-demo.
-- Safe to re-run: updates content_payload when logical_task_key already exists; otherwise inserts once.

do $$
declare
  v_quest_id uuid;
  v_anchor_order int;
  v_ins_order int;
  v_exists boolean;
  v_bump int;
  v_payload jsonb;
begin
  v_payload := $payload${
      "screenVariant": "reader",
      "title": "",
      "subtitle": "",
      "readerChrome": {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg",
        "headline": "Rubrica cultura — La città che legge",
        "subheadline": "Articolo dimostrativo (testo sintetico).",
        "columnCount": 2,
        "showLineNumbers": false,
        "bodyText": "Questo contenuto è un esempio per la rubrica ludica.\n\nLa lettura permette una pausa dall'azione degli altri compiti della quest.\n\nUsa nuovi paragrafi (riga vuota) per decidere dove spezzare le colonne: il client raggruppa i paragrafi nella colonna sinistra e poi in quella destra.\n\nAlla fine, il giocatore preme solo «Controlla» per continuare."
      },
      "blocks": []
    }$payload$::jsonb;

  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
    and is_active = true
  limit 1;

  if v_quest_id is null then
    raise notice 'special_screen_reader_demo: quest-01 not found; skipping';
    return;
  end if;

  select exists (
    select 1
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-special-screen-reader-demo'
  )
  into v_exists;

  if v_exists then
    update public.game_quest_steps s
    set
      content_payload = v_payload,
      updated_at = now()
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-special-screen-reader-demo';

    raise notice 'special_screen_reader_demo: updated quest-01-special-screen-reader-demo payload';
    return;
  end if;

  select s.order_index
  into v_anchor_order
  from public.game_quest_steps s
  where s.quest_id = v_quest_id
    and s.logical_task_key = 'quest-01-special-screen-sms-whatsapp-demo'
    and s.is_active = true
  limit 1;

  if v_anchor_order is null then
    select s.order_index
    into v_anchor_order
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-special-screen-foundation-demo'
      and s.is_active = true
    limit 1;
  end if;

  if v_anchor_order is null then
    select s.order_index
    into v_anchor_order
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-freitext-llm-demo'
      and s.is_active = true
    limit 1;
  end if;

  if v_anchor_order is null then
    raise notice 'special_screen_reader_demo: anchor step not found; skipping insert';
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
    'SpecialScreenReader',
    'task.special-screen.reader.magazine',
    'quest-01-special-screen-reader-demo',
    v_payload,
    '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb,
    true
  );

  raise notice 'special_screen_reader_demo: inserted quest-01-special-screen-reader-demo';
end $$;
