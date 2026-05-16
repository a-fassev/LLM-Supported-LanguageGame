-- Idempotent backpack CHECK guards (runs after player_backpack_pieces body in this repo).
-- Hosted project language-game-dev: same SQL was recorded via Supabase MCP as
-- migration version 20260516092753 (player_backpack_constraints_idempotent_guard).
-- Safe no-op when constraints already exist from earlier migration revisions.

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
