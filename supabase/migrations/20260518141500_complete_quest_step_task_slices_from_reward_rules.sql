-- Canonical implementation of complete_quest_step_task (single migration to edit rewards logic).
-- Runs immediately after chapter_quest_steps_greenfield (before advance_quest_cutscene_step).
--
-- PostgREST / Supabase exposes this RPC with four parameters (legacy slice argument). The caller's
-- p_awarded_slices value is IGNORED; pizza and backpack come only from reward_rules on the step row:
--   - pizza: reward_rules.pizza.mode='flat', value clamped to 0..5
--   - backpack: reward_rules.backpack.mode ∈ ('first_completion','none'); value clamped 0..1;
--               empty/absent backpack.mode defaults to first_completion (matching seed payloads).

drop function if exists public.complete_quest_step_task(uuid, uuid, uuid, int);
drop function if exists public.complete_quest_step_task(uuid, uuid, uuid);

create or replace function public.complete_quest_step_task(
  p_account_id uuid,
  p_run_id uuid,
  p_step_id uuid,
  p_awarded_slices int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run record;
  v_step_count int;
  v_next_step_index int;
  v_quest_complete boolean;
  v_expected_step record;
  v_awarded_backpack int;
  v_logical_task_key text;
  v_has_backpack boolean;
  v_new_total_slices int;
  v_new_total_backpack int;
  v_next_task_step_id uuid;
  v_now timestamptz := now();
  v_awarded_slices int := 0;
  v_pizza jsonb;
  v_mode text;
  v_raw text;
  v_backpack_rules jsonb;
  v_bp_mode text;
  v_bp_cap int;
  v_bp_raw text;
begin
  insert into public.player_wallets(account_id, total_slices, total_backpack_pieces, updated_at)
  values (p_account_id, 0, 0, v_now)
  on conflict (account_id) do nothing;

  select * into v_run
  from public.player_quest_runs
  where id = p_run_id
  for update;

  if not found or v_run.account_id <> p_account_id then
    return jsonb_build_object('ok', false, 'error', 'Run not found', 'code', 'run_not_found');
  end if;

  if v_run.status <> 'in_progress' then
    return jsonb_build_object('ok', false, 'error', 'Run is not active', 'code', 'run_not_active');
  end if;

  select count(*)::int
  into v_step_count
  from public.game_quest_steps
  where quest_id = v_run.quest_id
    and is_active = true;

  if v_step_count = 0 then
    return jsonb_build_object('ok', false, 'error', 'Quest has no active steps', 'code', 'no_steps');
  end if;

  if v_run.current_step_order_index < 0 or v_run.current_step_order_index >= v_step_count then
    return jsonb_build_object('ok', false, 'error', 'No pending step', 'code', 'no_pending_step');
  end if;

  select s.*
  into v_expected_step
  from public.game_quest_steps s
  where s.quest_id = v_run.quest_id
    and s.is_active = true
  order by s.order_index asc
  offset v_run.current_step_order_index
  limit 1;

  if v_expected_step.id is null then
    return jsonb_build_object('ok', false, 'error', 'No pending step', 'code', 'no_pending_step');
  end if;

  if v_expected_step.id <> p_step_id then
    return jsonb_build_object('ok', false, 'error', 'Step mismatch', 'code', 'step_mismatch');
  end if;

  if v_expected_step.step_kind <> 'task' then
    return jsonb_build_object('ok', false, 'error', 'Current step is not a task', 'code', 'step_not_task');
  end if;

  v_pizza := coalesce(v_expected_step.reward_rules -> 'pizza', '{}'::jsonb);
  v_mode := trim(coalesce(v_pizza ->> 'mode', ''));

  if v_mode = 'flat' then
    begin
      v_raw := trim(coalesce(v_pizza ->> 'value', ''));
      if v_raw = '' then
        v_awarded_slices := 0;
      else
        v_awarded_slices := round(v_raw::numeric)::int;
      end if;
    exception when others then
      v_awarded_slices := 0;
    end;

    if v_awarded_slices < 0 then
      v_awarded_slices := 0;
    elsif v_awarded_slices > 5 then
      v_awarded_slices := 5;
    end if;
  else
    v_awarded_slices := 0;
  end if;

  v_logical_task_key := coalesce(v_expected_step.logical_task_key, v_expected_step.id::text);

  select exists(
    select 1
    from public.player_step_attempts psa
    where psa.account_id = p_account_id
      and psa.logical_task_key = v_logical_task_key
      and psa.awarded_backpack_pieces > 0
  ) into v_has_backpack;

  v_backpack_rules := coalesce(v_expected_step.reward_rules -> 'backpack', '{}'::jsonb);
  v_bp_mode := lower(trim(coalesce(v_backpack_rules ->> 'mode', '')));

  begin
    v_bp_raw := trim(coalesce(v_backpack_rules ->> 'value', '1'));
    if v_bp_raw = '' then
      v_bp_cap := 1;
    else
      v_bp_cap := round(v_bp_raw::numeric)::int;
    end if;
  exception when others then
    v_bp_cap := 1;
  end;

  if v_bp_cap < 0 then v_bp_cap := 0; elsif v_bp_cap > 1 then v_bp_cap := 1; end if;

  if v_bp_mode = 'none' or v_bp_cap = 0 then
    v_awarded_backpack := 0;
  elsif v_bp_mode = '' or v_bp_mode = 'first_completion' then
    v_awarded_backpack := case when v_has_backpack then 0 else v_bp_cap end;
  else
    v_awarded_backpack := 0;
  end if;

  insert into public.player_step_attempts(
    account_id,
    run_id,
    step_id,
    logical_task_key,
    awarded_slices,
    awarded_backpack_pieces,
    completed_at
  )
  values (
    p_account_id,
    p_run_id,
    p_step_id,
    v_logical_task_key,
    v_awarded_slices,
    v_awarded_backpack,
    v_now
  );

  update public.player_wallets
  set
    total_slices = total_slices + v_awarded_slices,
    total_backpack_pieces = total_backpack_pieces + v_awarded_backpack,
    updated_at = v_now
  where account_id = p_account_id
  returning total_slices, total_backpack_pieces
  into v_new_total_slices, v_new_total_backpack;

  v_next_step_index := v_run.current_step_order_index + 1;
  v_quest_complete := v_next_step_index >= v_step_count;

  update public.player_quest_runs
  set
    current_step_order_index = v_next_step_index,
    current_task_order_index = current_task_order_index + 1,
    status = case when v_quest_complete then 'completed' else 'in_progress' end,
    completed_at = case when v_quest_complete then v_now else null end
  where id = p_run_id;

  if not v_quest_complete then
    select s.id
    into v_next_task_step_id
    from public.game_quest_steps s
    where s.quest_id = v_run.quest_id
      and s.is_active = true
      and s.order_index >= v_next_step_index
      and s.step_kind = 'task'
    order by s.order_index asc
    limit 1;
  end if;

  return jsonb_build_object(
    'ok', true,
    'awarded_slices', v_awarded_slices,
    'total_slices', v_new_total_slices,
    'total_backpack_pieces', v_new_total_backpack,
    'awarded_backpack_pieces', v_awarded_backpack,
    'quest_complete', v_quest_complete,
    'current_step_order_index', v_next_step_index,
    'current_task_order_index', (
      select current_task_order_index from public.player_quest_runs where id = p_run_id
    ),
    'next_task_step_id', case
      when v_next_task_step_id is null then null
      else to_jsonb(v_next_task_step_id::text)
    end
  );
end;
$$;

revoke all on function public.complete_quest_step_task(uuid, uuid, uuid, int) from public;
revoke all on function public.complete_quest_step_task(uuid, uuid, uuid, int) from anon, authenticated;
grant execute on function public.complete_quest_step_task(uuid, uuid, uuid, int) to service_role;

comment on column public.player_quest_runs.current_step_order_index is
  '0-based index of the upcoming step among active quest steps ordered by order_index.';
comment on column public.player_quest_runs.current_task_order_index is
  'Number of task steps completed in this run; advancing past cutscene steps does not increment this counter.';
