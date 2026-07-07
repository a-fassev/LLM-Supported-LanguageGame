-- Leaderboard ranks by lifetime pizza earned; shop spends only total_slices.
-- Backfill from player_scene_completions (authoritative earn history).

ALTER TABLE public.player_wallets
  ADD COLUMN IF NOT EXISTS lifetime_slices_earned int;

UPDATE public.player_wallets
SET lifetime_slices_earned = COALESCE(lifetime_slices_earned, 0)
WHERE lifetime_slices_earned IS NULL;

ALTER TABLE public.player_wallets
  ALTER COLUMN lifetime_slices_earned SET DEFAULT 0;

ALTER TABLE public.player_wallets
  ALTER COLUMN lifetime_slices_earned SET NOT NULL;

ALTER TABLE public.player_wallets
  DROP CONSTRAINT IF EXISTS player_wallets_lifetime_slices_earned_check;

ALTER TABLE public.player_wallets
  ADD CONSTRAINT player_wallets_lifetime_slices_earned_check
  CHECK (lifetime_slices_earned >= 0);

UPDATE public.player_wallets pw
SET lifetime_slices_earned = COALESCE(
  (
    SELECT SUM(awarded_slices)::int
    FROM public.player_scene_completions psc
    WHERE psc.account_id = pw.account_id
  ),
  0
);

-- Sanity (diagnostic only): lifetime_slices_earned should be >= total_slices for every account.
-- SELECT account_id, total_slices, lifetime_slices_earned
-- FROM public.player_wallets
-- WHERE lifetime_slices_earned < total_slices;
