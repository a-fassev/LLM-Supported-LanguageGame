-- Advances a quest run past a cutscene step (server-authoritative progression; no rewards).

create or replace function public.advance_quest_cutscene_step(
  p_account_id uuid,
  p_run_id uuid,
  p_step_id uuid
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
  v_next_task_step_id uuid;
  v_now timestamptz := now();
  v_slices int;
  v_backpack int;
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

  if v_expected_step.step_kind <> 'cutscene' then
    return jsonb_build_object('ok', false, 'error', 'Current step is not a cutscene', 'code', 'step_not_cutscene');
  end if;

  v_next_step_index := v_run.current_step_order_index + 1;
  v_quest_complete := v_next_step_index >= v_step_count;

  update public.player_quest_runs
  set
    current_step_order_index = v_next_step_index,
    status = case when v_quest_complete then 'completed' else 'in_progress' end,
    completed_at = case when v_quest_complete then v_now else null end
  where id = p_run_id;

  select pw.total_slices, pw.total_backpack_pieces into v_slices, v_backpack
  from public.player_wallets pw
  where pw.account_id = p_account_id;

  if not found then
    v_slices := 0;
    v_backpack := 0;
  end if;

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
    'total_slices', v_slices,
    'total_backpack_pieces', v_backpack,
    'awarded_backpack_pieces', 0,
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

revoke all on function public.advance_quest_cutscene_step(uuid, uuid, uuid) from public;
revoke all on function public.advance_quest_cutscene_step(uuid, uuid, uuid) from anon, authenticated;
grant execute on function public.advance_quest_cutscene_step(uuid, uuid, uuid) to service_role;
