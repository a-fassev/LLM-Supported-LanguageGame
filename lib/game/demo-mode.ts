/** Temporary showcase switch for the stakeholder demo. Not for classroom study play. */
export const DEMO_ACCOUNT_USERNAME = "demo-showcase-9001";

export function isGameDemoMode(): boolean {
  return process.env.GAME_DEMO_MODE === "true";
}

export function isDemoAccountUsername(username: string): boolean {
  return username === DEMO_ACCOUNT_USERNAME;
}
