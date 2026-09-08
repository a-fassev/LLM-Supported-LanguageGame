import { DEMO_ACCOUNT_USERNAME, isGameDemoMode } from "@/lib/game/demo-mode";

/**
 * Pilot class leaderboard allowlist. Sync with docs/pilot-student-accounts-2026-07-06.md
 * (rows marked Leaderboard: include). Only these usernames appear in Classifica,
 * plus the showcase demo account. Demo mode is hardcoded on, so any signed-in
 * account can open Classifica until `isGameDemoMode()` is reverted.
 */
export const PILOT_LEADERBOARD_USERNAMES = [
  "bright-lion-9524",
  "bright-panda-8958",
  "bright-rabbit-1942",
  "clever-bear-4833",
  "clever-otter-9621",
  "lively-bear-3127",
  "lively-fox-2088",
  "noble-falcon-5792",
  "noble-fox-8801",
  "polite-otter-8082",
  "polite-raven-7782",
  "polite-wolf-8258",
  "quick-bear-2363",
  "quick-wolf-1224",
  "swift-shark-4983",
  "witty-fox-2980",
  "witty-shark-4941",
  DEMO_ACCOUNT_USERNAME,
] as const;

const pilotLeaderboardUsernameSet = new Set<string>(PILOT_LEADERBOARD_USERNAMES);

export function isLeaderboardEligibleUsername(username: string): boolean {
  if (isGameDemoMode()) return true;
  return pilotLeaderboardUsernameSet.has(username);
}
