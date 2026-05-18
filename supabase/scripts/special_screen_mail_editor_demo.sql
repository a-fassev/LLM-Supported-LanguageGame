-- E-mail / letter editor Special Screen demo for quest-01 (mail chrome + embedded cloze).
-- task_type: SpecialScreenMailEditor | mailChrome stationery + blocks[] mechanic in body.
-- Anchor for first insert: after quest-01-special-screen-reader-demo if present, else
-- quest-01-special-screen-sms-whatsapp-demo, else quest-01-special-screen-foundation-demo,
-- else quest-01-freitext-llm-demo.
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
      "screenVariant": "mail",
      "mailChrome": {
        "from": "studio.italiano@scuola.it",
        "to": "prof.rossi@scuola.it",
        "subject": "Compito: e-mail formale (dimostrazione)",
        "greeting": "Gentile Prof.ssa Rossi,",
        "closing": "Cordiali saluti,\nIl gruppo dimostrativo",
        "sendButtonText": "Invia",
        "sendSuccessText": "E-mail inviata."
      },
      "blocks": [
        {
          "blockType": "cloze_text",
          "clozeText": {
            "prompt": "Completa il messaggio con la forma adatta.",
            "caseSensitive": false,
            "lines": [
              {
                "segments": [
                  { "kind": "text", "text": "La scrivo per " },
                  { "kind": "gap", "correctAnswers": ["chiedere", "domandare"], "maxLength": 24 },
                  { "kind": "text", "text": " un chiarimento sulla consegna." }
                ]
              }
            ]
          }
        }
      ]
    }$payload$::jsonb;

  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
    and is_active = true
  limit 1;

  if v_quest_id is null then
    raise notice 'special_screen_mail_editor_demo: quest-01 not found; skipping';
    return;
  end if;

  select exists (
    select 1
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-special-screen-mail-editor-demo'
  )
  into v_exists;

  if v_exists then
    update public.game_quest_steps s
    set
      content_payload = v_payload,
      updated_at = now()
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-special-screen-mail-editor-demo';

    raise notice 'special_screen_mail_editor_demo: updated quest-01-special-screen-mail-editor-demo payload';
    return;
  end if;

  select s.order_index
  into v_anchor_order
  from public.game_quest_steps s
  where s.quest_id = v_quest_id
    and s.logical_task_key = 'quest-01-special-screen-reader-demo'
    and s.is_active = true
  limit 1;

  if v_anchor_order is null then
    select s.order_index
    into v_anchor_order
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-special-screen-sms-whatsapp-demo'
      and s.is_active = true
    limit 1;
  end if;

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
    raise notice 'special_screen_mail_editor_demo: anchor step not found; skipping insert';
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
    'SpecialScreenMailEditor',
    'task.special-screen.mail.editor',
    'quest-01-special-screen-mail-editor-demo',
    v_payload,
    '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb,
    true
  );

  raise notice 'special_screen_mail_editor_demo: inserted quest-01-special-screen-mail-editor-demo';
end $$;
