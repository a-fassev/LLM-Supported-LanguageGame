-- Dev-only: reset all game progression for exactly one student account.
-- Deletes quest runs (player_step_attempts cascade), zeros wallet totals.
-- Run in Supabase SQL Editor or via MCP execute_sql using a privileged role.

do $$
declare
  account_count integer;
  aid uuid;
begin
  select count(*) into account_count from public.student_accounts;

  if account_count <> 1 then
    raise exception
      using message = format(
        'Refusing reset: student_accounts has % rows (expected exactly 1).',
        account_count
      );
  end if;

  select id into strict aid from public.student_accounts limit 1;

  delete from public.player_quest_runs where account_id = aid;

  insert into public.player_wallets (account_id, total_slices, total_backpack_pieces, updated_at)
  values (aid, 0, 0, now())
  on conflict (account_id) do update set
    total_slices = excluded.total_slices,
    total_backpack_pieces = excluded.total_backpack_pieces,
    updated_at = excluded.updated_at;
end $$;
