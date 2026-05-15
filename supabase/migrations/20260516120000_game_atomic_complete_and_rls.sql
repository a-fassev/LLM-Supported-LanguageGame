-- Atomic task completion (single transaction, row lock on run) + RLS on game tables.
-- Supabase service_role bypasses RLS; anon/authenticated cannot access these tables via PostgREST without policies.

-- ---------------------------------------------------------------------------
-- RPC: validate run, insert attempt, atomically increment wallet, advance run
-- ---------------------------------------------------------------------------
create or replace function public.complete_game_task(
  p_account_id uuid,
  p_run_id uuid,
  p_task_id uuid,
  p_awarded_slices int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run record;
  v_task_count int;
  v_expected_task_id uuid;
  v_next_idx int;
  v_level_complete boolean;
  v_new_total int;
  v_now timestamptz := now();
  v_next_task_id uuid;
begin
  if p_awarded_slices < 0 or p_awarded_slices > 5 then
    return jsonb_build_object(
      'ok', false,
      'error', 'Invalid award',
      'code', 'invalid_award'
    );
  end if;

  insert into public.player_wallets (account_id, total_slices, updated_at)
  values (p_account_id, 0, v_now)
  on conflict (account_id) do nothing;

  select * into v_run
  from public.player_level_runs
  where id = p_run_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'Run not found',
      'code', 'run_not_found'
    );
  end if;

  if v_run.account_id <> p_account_id then
    return jsonb_build_object(
      'ok', false,
      'error', 'Run not found',
      'code', 'run_not_found'
    );
  end if;

  if v_run.status <> 'in_progress' then
    return jsonb_build_object(
      'ok', false,
      'error', 'Run is not active',
      'code', 'run_not_active'
    );
  end if;

  select count(*)::int into v_task_count
  from public.game_tasks
  where level_id = v_run.level_id and is_active = true;

  if v_task_count = 0 then
    return jsonb_build_object(
      'ok', false,
      'error', 'Level has no tasks',
      'code', 'no_tasks'
    );
  end if;

  if v_run.current_task_order_index < 0 or v_run.current_task_order_index >= v_task_count then
    return jsonb_build_object(
      'ok', false,
      'error', 'No pending task',
      'code', 'no_pending_task'
    );
  end if;

  select id into v_expected_task_id
  from public.game_tasks
  where level_id = v_run.level_id and is_active = true
  order by order_index asc
  offset v_run.current_task_order_index
  limit 1;

  if v_expected_task_id is null or v_expected_task_id <> p_task_id then
    return jsonb_build_object(
      'ok', false,
      'error', 'Task mismatch',
      'code', 'task_mismatch'
    );
  end if;

  insert into public.player_task_attempts (run_id, task_id, awarded_slices, completed_at)
  values (p_run_id, p_task_id, p_awarded_slices, v_now);

  update public.player_wallets
  set
    total_slices = total_slices + p_awarded_slices,
    updated_at = v_now
  where account_id = p_account_id
  returning total_slices into v_new_total;

  v_next_idx := v_run.current_task_order_index + 1;
  v_level_complete := v_next_idx >= v_task_count;

  if v_level_complete then
    update public.player_level_runs
    set
      current_task_order_index = v_next_idx,
      status = 'completed',
      completed_at = v_now
    where id = p_run_id;
    v_next_task_id := null;
  else
    update public.player_level_runs
    set
      current_task_order_index = v_next_idx,
      status = 'in_progress',
      completed_at = null
    where id = p_run_id;

    select id into v_next_task_id
    from public.game_tasks
    where level_id = v_run.level_id and is_active = true
    order by order_index asc
    offset v_next_idx
    limit 1;
  end if;

  return jsonb_build_object(
    'ok', true,
    'total_slices', v_new_total,
    'level_complete', v_level_complete,
    'current_task_order_index', v_next_idx,
    'current_task_id', case
      when v_next_task_id is null then null
      else to_jsonb(v_next_task_id::text)
    end
  );
end;
$$;

revoke all on function public.complete_game_task(uuid, uuid, uuid, int) from public;
revoke all on function public.complete_game_task(uuid, uuid, uuid, int) from anon, authenticated;
grant execute on function public.complete_game_task(uuid, uuid, uuid, int) to service_role;

-- ---------------------------------------------------------------------------
-- RLS: block direct client access; server uses service_role and bypasses RLS
-- ---------------------------------------------------------------------------
alter table public.game_levels enable row level security;
alter table public.game_tasks enable row level security;
alter table public.player_wallets enable row level security;
alter table public.player_level_runs enable row level security;
alter table public.player_task_attempts enable row level security;
