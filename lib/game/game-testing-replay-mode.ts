/** QA branch only — set false before learner pilot / merge to main. Not env-driven. */
export const GAME_TESTING_REPLAY_MODE = true;

export function isGameTestingReplayMode(): boolean {
  return GAME_TESTING_REPLAY_MODE;
}
