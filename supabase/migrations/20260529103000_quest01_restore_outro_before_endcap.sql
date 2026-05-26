-- If quest-01 lost `cutscene.outro` (e.g. superseded row at same order_index), restore it
-- immediately before `cutscene.quest01.endcap`. Idempotent: no-op when outro already exists.

do $$
declare
  v_quest_id uuid;
  v_endcap_order integer;
  v_outro_exists boolean;
begin
  select id
  into v_quest_id
  from public.game_quests
  where slug = 'quest-01'
    and is_active = true
  limit 1;

  if v_quest_id is null then
    raise notice 'quest01_outro_restore: quest-01 not found; skipping';
    return;
  end if;

  select exists (
      select 1
      from public.game_quest_steps s
      where s.quest_id = v_quest_id
        and s.step_kind = 'cutscene'
        and s.template_key = 'cutscene.outro'
        and s.is_active = true
    )
    into v_outro_exists;

  if v_outro_exists then
    raise notice 'quest01_outro_restore: outro already present; skipping';
    return;
  end if;

  select s.order_index
  into v_endcap_order
  from public.game_quest_steps s
  where s.quest_id = v_quest_id
    and s.template_key = 'cutscene.quest01.endcap'
    and s.is_active = true
  limit 1;

  if v_endcap_order is null then
    raise notice 'quest01_outro_restore: endcap not found; skipping';
    return;
  end if;

  update public.game_quest_steps
  set
    order_index = order_index + 1,
    updated_at = now()
  where quest_id = v_quest_id
    and order_index >= v_endcap_order
    and is_active = true;

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
    v_endcap_order,
    'cutscene',
    null,
    'cutscene.outro',
    null,
    '{"beats":[{"presentationMode":"narrator","title":"Ottimo","body":"Hai finito la prima quest."}]}'::jsonb,
    '{}'::jsonb,
    true
  );
end $$;
