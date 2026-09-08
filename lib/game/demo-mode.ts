/** Temporary showcase switch for the stakeholder demo. Not for classroom study play. */
export const DEMO_ACCOUNT_USERNAME = "demo-showcase-9001";

/**
 * Hardcoded on for the live showcase. Production Azure needs no Application Setting.
 * Tests (and a later revert) can set `GAME_DEMO_MODE=false` to restore study locks.
 */
export function isGameDemoMode(): boolean {
  return process.env.GAME_DEMO_MODE !== "false";
}

export function isDemoAccountUsername(username: string): boolean {
  return username === DEMO_ACCOUNT_USERNAME;
}
