import {
  countBackpackProgressTasks,
  deriveBackpackProgress,
} from "@/lib/game/backpack-progress";
import { loadContentCatalog } from "@/lib/game/content/catalog-loader";
import { compareLeaderboardPlayers } from "@/lib/game/leaderboard-player-sort";
import { gameClientMessages as msg } from "@/lib/game/clientMessages";
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
  totalBackpackPieces: number;
  backpackProgressPercent: number;
  isSelf: boolean;
};

export type LeaderboardTeamMemberClientDto = {
  username: string;
  isSelf: boolean;
};

export type LeaderboardTeamClientDto = {
  rank: number;
  team: StudentTeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
  memberCount: number;
  members: LeaderboardTeamMemberClientDto[];
};

export type LeaderboardSelfClientDto = {
  username: string;
  team: StudentTeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
  backpackProgressPercent: number;
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

function backpackPercentForPieces(totalBackpackPieces: number, totalTasks: number): number {
  return deriveBackpackProgress(totalBackpackPieces, totalTasks).backpackProgressPercent;
}

/** Overall rank uses pizza (`totalSlices`); backpack percent is display-only on player rows. */
function mapOverallRows(
  rows: LeaderboardPlayerRow[],
  accountId: string,
  totalTasks: number,
): LeaderboardPlayerClientDto[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    username: row.username,
    team: row.team,
    totalSlices: row.totalSlices,
    totalBackpackPieces: row.totalBackpackPieces,
    backpackProgressPercent: backpackPercentForPieces(row.totalBackpackPieces, totalTasks),
    isSelf: row.accountId === accountId,
  }));
}

function mapTeamRows(
  aggregates: LeaderboardTeamAggregateRow[],
  players: LeaderboardPlayerRow[],
  accountId: string,
): LeaderboardTeamClientDto[] {
  const membersByTeam: Record<StudentTeamColor, LeaderboardTeamMemberClientDto[]> = {
    blue: [],
    red: [],
  };

  const playersByPerformance = [...players].sort(compareLeaderboardPlayers);

  for (const player of playersByPerformance) {
    membersByTeam[player.team].push({
      username: player.username,
      isSelf: player.accountId === accountId,
    });
  }

  return aggregates.map((row, index) => {
    const members = membersByTeam[row.team];
    return {
      rank: index + 1,
      team: row.team,
      totalSlices: row.totalSlices,
      totalBackpackPieces: row.totalBackpackPieces,
      memberCount: members.length,
      members,
    };
  });
}

export async function getLeaderboardState(accountId: string): Promise<LeaderboardResult> {
  const [selfContext, playerRows, catalog] = await Promise.all([
    getStudentAccountLeaderboardSelfContext(accountId),
    listLeaderboardPlayerRows(),
    loadContentCatalog().catch((error) => {
      console.error("[leaderboard-service] catalog load", error);
      return null;
    }),
  ]);

  if (!catalog) {
    return { ok: false, status: 500, error: msg.couldNotLoadCatalog, code: "catalog_unavailable" };
  }

  const backpackTotalTasks = countBackpackProgressTasks(catalog);

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
      backpackProgressPercent: backpackPercentForPieces(totalBackpackPieces, backpackTotalTasks),
      overallRank,
    },
    overall: mapOverallRows(playerRows, accountId, backpackTotalTasks),
    teams: mapTeamRows(teamAggregates, playerRows, accountId),
  };
}
