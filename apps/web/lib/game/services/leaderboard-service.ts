import {
  computeLeaderboardTeamAggregates,
  getStudentAccountLeaderboardSelfContext,
  listLeaderboardPlayerRows,
  type LeaderboardPlayerRow,
  type LeaderboardTeamAggregateRow,
  type StudentTeamColor,
} from "@/lib/game/repositories/game-progress-repository";

export type LeaderboardPlayerClientDto = {
  rank: number;
  username: string;
  team: StudentTeamColor;
  totalSlices: number;
  isSelf: boolean;
};

export type LeaderboardTeamClientDto = {
  rank: number;
  team: StudentTeamColor;
  totalSlices: number;
  memberCount: number;
};

export type LeaderboardSelfClientDto = {
  username: string;
  team: StudentTeamColor;
  totalSlices: number;
  overallRank: number;
};

export type LeaderboardResult =
  | {
      ok: true;
      self: LeaderboardSelfClientDto;
      overall: LeaderboardPlayerClientDto[];
      teams: LeaderboardTeamClientDto[];
    }
  | { ok: false; status: number; error: string; code?: string };

function mapOverallRows(
  rows: LeaderboardPlayerRow[],
  accountId: string,
): LeaderboardPlayerClientDto[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    team: row.team,
    totalSlices: row.totalSlices,
    isSelf: row.accountId === accountId,
  }));
}

function mapTeamRows(rows: LeaderboardTeamAggregateRow[]): LeaderboardTeamClientDto[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    team: row.team,
    totalSlices: row.totalSlices,
    memberCount: row.memberCount,
  }));
}

export async function getLeaderboardState(accountId: string): Promise<LeaderboardResult> {
  const [selfContext, playerRows] = await Promise.all([
    getStudentAccountLeaderboardSelfContext(accountId),
    listLeaderboardPlayerRows(),
  ]);

  if (!selfContext) {
    return { ok: false, status: 500, error: "Could not load player profile", code: "profile_load_failed" };
  }

  if (!playerRows) {
    return { ok: false, status: 500, error: "Could not load leaderboard", code: "leaderboard_load_failed" };
  }

  const selfIndex = playerRows.findIndex((row) => row.accountId === accountId);
  const overallRank = selfIndex >= 0 ? selfIndex + 1 : playerRows.length + 1;
  const totalSlices =
    selfIndex >= 0 ? playerRows[selfIndex].totalSlices : selfContext.totalSlices;

  const teamAggregates = computeLeaderboardTeamAggregates(playerRows);

  return {
    ok: true,
    self: {
      username: selfContext.username,
      team: selfContext.team,
      totalSlices,
      overallRank,
    },
    overall: mapOverallRows(playerRows, accountId),
    teams: mapTeamRows(teamAggregates),
  };
}
