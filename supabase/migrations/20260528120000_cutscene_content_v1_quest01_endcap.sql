-- Cutscene content_json v1 (title + body required; optional schemaVersion, subtitle, etc.).
-- Quest-01: refresh intro copy and append an example closing cutscene after all existing steps.
-- Idempotent: endcap skipped when template_key cutscene.quest01.endcap already exists.

-- Refresh introductory cutscene for quest-01 (first cutscene by order_index).
update public.game_quest_steps s
set
  content_payload = $intro${
    "schemaVersion": 1,
    "title": "Benvenuto nella città",
    "subtitle": "Iniziamo insieme",
    "body": "Siamo in Italia per una piccola missione linguistica: ascolta, leggi e rispondi con calma. Quando sei pronto, premi Avanti per entrare nel primo compito.",
    "tone": "neutral",
    "illustrationId": "city-street-soft"
  }$intro$::jsonb,
  updated_at = now()
from public.game_quests q
where s.quest_id = q.id
  and q.slug = 'quest-01'
  and q.is_active = true
  and s.step_kind = 'cutscene'
  and s.template_key = 'cutscene.intro'
  and s.is_active = true;

do $$
declare
  v_quest_id uuid;
  v_max_order integer;
  v_next_order integer;
  v_exists boolean;
begin
  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
    and is_active = true
  limit 1;

  if v_quest_id is null then
    raise notice 'cutscene_quest01_endcap: quest-01 not found; skipping';
    return;
  end if;

  select exists (
      select 1
      from public.game_quest_steps s
      where s.quest_id = v_quest_id
        and s.template_key = 'cutscene.quest01.endcap'
        and s.is_active = true
    )
    into v_exists;

  if v_exists then
    raise notice 'cutscene_quest01_endcap: already present; skipping';
    return;
  end if;

  select coalesce(max(s.order_index), -1)
  into v_max_order
  from public.game_quest_steps s
  where s.quest_id = v_quest_id
    and s.is_active = true;

  v_next_order := v_max_order + 1;

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
    v_next_order,
    'cutscene',
    null,
    'cutscene.quest01.endcap',
    null,
    $cap${
      "schemaVersion": 1,
      "title": "Hai quasi finito questa demo",
      "subtitle": "Un ultimo saluto",
      "body": "Complimenti: hai visto introduzione, compiti e piccole ricompense. Torna quando vuoi dalla mappa per continuare il capitolo — premi Avanti per chiudere questo passaggio.",
      "tone": "celebratory",
      "primaryCtaLabel": "Avanti"
    }$cap$::jsonb,
    '{}'::jsonb,
    true
  );
end $$;
