-- Backpack pieces per player (distinct tasks completed) + RPC updates.
-- Note: Hosted projects may register this revision under a Supabase MCP-generated timestamp;
-- ordering in this repo must stay after game_atomic_complete_and_rls.

alter table public.player_wallets
  add column if not exists total_backpack_pieces int not null default 0;

alter table public.player_task_attempts
  add column if not exists awarded_backpack_pieces int not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'player_wallets_backpack_nonneg'
  ) then
    alter table public.player_wallets
      add constraint player_wallets_backpack_nonneg check (total_backpack_pieces >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'player_task_attempts_backpack_nonneg'
  ) then
    alter table public.player_task_attempts
      add constraint player_task_attempts_backpack_nonneg check (
        awarded_backpack_pieces >= 0 and awarded_backpack_pieces <= 1
      );
  end if;
end $$;

-- Backfill: one backpack piece per distinct task ever completed (matches first-time-global rule historically).
update public.player_wallets w
set total_backpack_pieces = coalesce(bt.distinct_tasks, 0)
from (
  select plr.account_id,
         count(distinct pta.task_id)::int as distinct_tasks
  from public.player_task_attempts pta
  join public.player_level_runs plr on plr.id = pta.run_id
  group by plr.account_id
) bt
where w.account_id = bt.account_id;

-- Preserve prior grant history: mark first attempt row per (account_id, task_id) as backpack=1 where applicable.
with ranked as (
  select pta.id,
         row_number() over (
           partition by plr.account_id, pta.task_id
           order by pta.completed_at asc
         ) as rn
  from public.player_task_attempts pta
  join public.player_level_runs plr on plr.id = pta.run_id
)
update public.player_task_attempts pta
set awarded_backpack_pieces = case when ranked.rn = 1 then 1 else 0 end
from ranked
where pta.id = ranked.id;

-- ---------------------------------------------------------------------------
-- RPC: slices (performance placeholder) + backpack (once per task per account)
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
  v_new_total_slices int;
  v_new_total_backpack int;
  v_now timestamptz := now();
  v_next_task_id uuid;
  v_has_prior_attempt boolean;
  v_awarded_backpack int;
begin
  if p_awarded_slices < 0 or p_awarded_slices > 5 then
    return jsonb_build_object(
      'ok', false,
      'error', 'Invalid award',
      'code', 'invalid_award'
    );
  end if;

  insert into public.player_wallets (account_id, total_slices, total_backpack_pieces, updated_at)
  values (p_account_id, 0, 0, v_now)
  on conflict (account_id) do nothing;

  select exists (
    select 1
    from public.player_task_attempts pta
    join public.player_level_runs plr on plr.id = pta.run_id
    where plr.account_id = p_account_id
      and pta.task_id = p_task_id
  ) into v_has_prior_attempt;

  if v_has_prior_attempt then
    v_awarded_backpack := 0;
  else
    v_awarded_backpack := 1;
  end if;

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

  insert into public.player_task_attempts (
    run_id,
    task_id,
    awarded_slices,
    awarded_backpack_pieces,
    completed_at
  )
  values (p_run_id, p_task_id, p_awarded_slices, v_awarded_backpack, v_now);

  update public.player_wallets
  set
    total_slices = total_slices + p_awarded_slices,
    total_backpack_pieces = total_backpack_pieces + v_awarded_backpack,
    updated_at = v_now
  where account_id = p_account_id
  returning total_slices, total_backpack_pieces into v_new_total_slices, v_new_total_backpack;

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
    'total_slices', v_new_total_slices,
    'total_backpack_pieces', v_new_total_backpack,
    'awarded_backpack_pieces', v_awarded_backpack,
    'level_complete', v_level_complete,
    'current_task_order_index', v_next_idx,
    'current_task_id', case
      when v_next_task_id is null then null
      else to_jsonb(v_next_task_id::text)
    end
  );
end;
$$;
