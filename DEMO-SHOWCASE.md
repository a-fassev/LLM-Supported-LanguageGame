# Stakeholder demo setup

How to show Classifica, free chapter/quest start, in-quest scene jumping, and a pizza-rich shop account. This is a **temporary showcase switch**, not classroom study behaviour.

Demo mode is **hardcoded on** in `lib/game/demo-mode.ts`. After merge to `main`, Azure needs **no Application Setting**.

## What we change (and why this shape)

Composer 2.5 scans of leaderboard, unlock/progression, and wallet/shop agreed on one server flag rather than rewriting study progression:

| Need | Existing gate | Demo approach |
| --- | --- | --- |
| Classifica visible | Menu uses `session.leaderboardEligible`; API filters `PILOT_LEADERBOARD_USERNAMES` | Add `demo-showcase-9001` to the whitelist; demo mode also treats **every** login as eligible |
| Jump between chapters / missions | Hub + `isChapterAccessBlocked` / `isQuestProgressionLockedForAccount` / `quest_already_completed` | Flag skips those locks; bootstrap `demoMode` lets the hub open completed tiles; starting a **different** quest **abandons** the active run |
| Jump between tasks | Only `Indietro` (previous scene) | `POST /api/game/runs/[runId]/jump` + Pause list **Salta alla scena** |
| Shop pizza | No admin grant API; shop costs **450** for the full room | SQL grant **500** spendable + **500** lifetime (leaderboard) |

Do **not** enable `GAME_SMOKE_AUTO_PASS` for this demo unless you also want every Controlla to auto-pass.

## Switch it on

1. **App:** already on in code (`isGameDemoMode()` returns true). Merge/deploy is enough.
2. **Database (once):** run the SQL below on the linked Supabase project (SQL editor). This agent cannot create the account (no `SUPABASE_SECRET_KEY` here).

### Demo account SQL

Username matches the code constant `DEMO_ACCOUNT_USERNAME` in `lib/game/demo-mode.ts`. Password is plaintext (same as other student accounts).

```sql
INSERT INTO public.student_accounts (username, password)
VALUES ('demo-showcase-9001', 'DemoPizza2026')
ON CONFLICT (username) DO UPDATE
SET password = EXCLUDED.password;

INSERT INTO public.player_wallets (
  account_id,
  total_slices,
  lifetime_slices_earned,
  total_backpack_pieces,
  updated_at
)
SELECT id, 500, 500, 0, now()
FROM public.student_accounts
WHERE username = 'demo-showcase-9001'
ON CONFLICT (account_id) DO UPDATE SET
  total_slices = 500,
  lifetime_slices_earned = GREATEST(player_wallets.lifetime_slices_earned, 500),
  updated_at = now();
```

Login: **`demo-showcase-9001`** / **`DemoPizza2026`**.

500 slices = full Negozio (450) plus a little leftover. Lifetime 500 puts the row high on Classifica versus typical pilot totals.

## How to show it tomorrow

1. Log in as `demo-showcase-9001`.
2. **Classifica** on the main menu should be enabled; the demo row should appear (after SQL).
3. **Gioca** → any chapter, including later ones and completed missions.
4. Inside a mission: **Pausa** → **Salta alla scena** to hop story/tasks without finishing them in order.
5. **Negozio** — buy a few items (balance 500). Leaderboard rank does not drop when you spend.

If another mission is already in progress, starting a different one in demo mode **abandons** the previous run (position only; pizza already earned stays).

## How to turn it off after the demo

1. Change `isGameDemoMode()` in `lib/game/demo-mode.ts` so it returns `false` (or keep `GAME_DEMO_MODE=false` only for tests).
2. Optionally leave `demo-showcase-9001` on the whitelist or remove it from `lib/game/leaderboard-pilot-whitelist.ts`.
3. Classroom locks, scheduled release, and `quest_already_completed` return to normal.

## Code map

| Area | Files |
| --- | --- |
| Flag | `lib/game/demo-mode.ts` |
| Leaderboard | `lib/game/leaderboard-pilot-whitelist.ts`, `leaderboard-service.ts`, session `leaderboardEligible` |
| Locks | `quest-progression-lock.ts`, `chapter-release-schedule.ts`, `startOrResumeRun` |
| Hub | bootstrap `demoMode`; `chapters/page.tsx`, `QuestList` / `ChapterGrid` `allowReplay` |
| Scene jump | `jumpRunScene`, `app/api/game/runs/[runId]/jump/route.ts`, `PauseOverlay` |
