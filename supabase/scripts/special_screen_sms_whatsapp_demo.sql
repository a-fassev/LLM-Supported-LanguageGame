-- SMS/WhatsApp-style Special Screen demo for quest-01 (smartphone mockup + embedded cloze).
-- Cloze sits in an outgoing (player) bubble so the learner completes their own reply.
-- task_type: SpecialScreenSms | screenVariant: whatsapp.
-- Anchor for first insert: after quest-01-special-screen-foundation-demo if present, else quest-01-freitext-llm-demo.
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
      "screenVariant": "whatsapp",
      "smsChrome": {
        "statusBar": {
          "timeText": "14:32",
          "signalHint": "LTE ●●●●●"
        },
        "chatHeaderTitle": "Marco",
        "messages": [
          {
            "direction": "incoming",
            "author": "Marco",
            "text": "Ciao! Pizza stasera? A che ora ti va bene?"
          },
          {
            "direction": "outgoing",
            "hostsEmbeddedMechanic": true,
            "embeddedMechanicBlockIndex": 0,
            "text": ""
          }
        ]
      },
      "blocks": [
        {
          "blockType": "cloze_text",
          "clozeText": {
            "prompt": "",
            "caseSensitive": false,
            "lines": [
              {
                "segments": [
                  { "kind": "text", "text": "Alle " },
                  { "kind": "gap", "correctAnswers": ["otto", "8"], "maxLength": 12 },
                  { "kind": "text", "text": " va bene!" }
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
    raise notice 'special_screen_sms_whatsapp_demo: quest-01 not found; skipping';
    return;
  end if;

  select exists (
    select 1
    from public.game_quest_steps s
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-special-screen-sms-whatsapp-demo'
  )
  into v_exists;

  if v_exists then
    update public.game_quest_steps s
    set
      content_payload = v_payload,
      updated_at = now()
    where s.quest_id = v_quest_id
      and s.logical_task_key = 'quest-01-special-screen-sms-whatsapp-demo';

    raise notice 'special_screen_sms_whatsapp_demo: updated quest-01-special-screen-sms-whatsapp-demo payload';
    return;
  end if;

  select s.order_index
  into v_anchor_order
  from public.game_quest_steps s
  where s.quest_id = v_quest_id
    and s.logical_task_key = 'quest-01-special-screen-foundation-demo'
    and s.is_active = true
  limit 1;

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
    raise notice 'special_screen_sms_whatsapp_demo: anchor step not found; skipping insert';
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
    'SpecialScreenSms',
    'task.special-screen.sms.whatsapp',
    'quest-01-special-screen-sms-whatsapp-demo',
    v_payload,
    '{"pizza":{"mode":"flat","value":2},"backpack":{"mode":"first_completion","value":1}}'::jsonb,
    true
  );

  raise notice 'special_screen_sms_whatsapp_demo: inserted quest-01-special-screen-sms-whatsapp-demo';
end $$;
