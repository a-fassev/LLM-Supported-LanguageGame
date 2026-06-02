import {
  computeLeaderboardTeamAggregates,
  getStudentAccountLeaderboardSelfContext,
  listLeaderboardPlayerRows,
  type LeaderboardPlayerRow,
  type LeaderboardTeamAggregateRow,
  type StudentTeamColor,
} from "@/lib/game/repositories/game-progress-repository";
import { gameClientMessages as msg } from "@/lib/game/clientMessages";

export type LeaderboardPlayerClientDto = {
  rank: number;
  username: string;
  team: StudentTeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
  isSelf: boolean;
};

export type LeaderboardTeamClientDto = {
  rank: number;
  team: StudentTeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
  memberCount: number;
};

export type LeaderboardSelfClientDto = {
  username: string;
  team: StudentTeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
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

/** Overall rank uses pizza (`totalSlices`); backpack totals are display-only on player rows. */
function mapOverallRows(
  rows: LeaderboardPlayerRow[],
  accountId: string,
): LeaderboardPlayerClientDto[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    team: row.team,
    totalSlices: row.totalSlices,
    totalBackpackPieces: row.totalBackpackPieces,
    isSelf: row.accountId === accountId,
  }));
}

function mapTeamRows(rows: LeaderboardTeamAggregateRow[]): LeaderboardTeamClientDto[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    team: row.team,
    totalSlices: row.totalSlices,
    totalBackpackPieces: row.totalBackpackPieces,
    memberCount: row.memberCount,
  }));
}

export async function getLeaderboardState(accountId: string): Promise<LeaderboardResult> {
  const [selfContext, playerRows] = await Promise.all([
    getStudentAccountLeaderboardSelfContext(accountId),
    listLeaderboardPlayerRows(),
  ]);

  if (!selfContext) {
    return { ok: false, status: 500, error: msg.couldNotLoadProfile, code: "profile_load_failed" };
  }

  if (!playerRows) {
    return { ok: false, status: 500, error: msg.couldNotLoadLeaderboard, code: "leaderboard_load_failed" };
  }

  const selfIndex = playerRows.findIndex((row) => row.accountId === accountId);
  const overallRank = selfIndex >= 0 ? selfIndex + 1 : playerRows.length + 1;
  const totalSlices =
    selfIndex >= 0 ? playerRows[selfIndex].totalSlices : selfContext.totalSlices;
  const totalBackpackPieces =
    selfIndex >= 0
      ? playerRows[selfIndex].totalBackpackPieces
      : selfContext.totalBackpackPieces;

  const teamAggregates = computeLeaderboardTeamAggregates(playerRows);

  return {
    ok: true,
    self: {
      username: selfContext.username,
      team: selfContext.team,
      totalSlices,
      totalBackpackPieces,
      overallRank,
    },
    overall: mapOverallRows(playerRows, accountId),
    teams: mapTeamRows(teamAggregates),
  };
}
