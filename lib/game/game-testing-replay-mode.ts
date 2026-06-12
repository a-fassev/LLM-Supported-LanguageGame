/**
 * QA / deployed test builds only. Set false before learner pilot.
 * Not read from Azure env — flip in source and redeploy.
 */
export const GAME_TESTING_REPLAY_MODE = true;

export function isGameTestingReplayMode(): boolean {
  return GAME_TESTING_REPLAY_MODE;
}
