export type LeaderboardPlayerSortKey = {
  totalSlices: number;
  username: string;
};

/** Pizza first, then Italian locale on username (matches leaderboard list + team members). */
export function compareLeaderboardPlayers(
  a: LeaderboardPlayerSortKey,
  b: LeaderboardPlayerSortKey,
): number {
  if (b.totalSlices !== a.totalSlices) return b.totalSlices - a.totalSlices;
  return a.username.localeCompare(b.username, "it");
}
