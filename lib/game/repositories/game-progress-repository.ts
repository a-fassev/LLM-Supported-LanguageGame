import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type WalletTotals = {
  totalSlices: number;
  totalBackpackPieces: number;
};

function admin(): SupabaseClient {
  return getSupabaseAdmin();
}

function coerceNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function ensureWalletRow(accountId: string): Promise<boolean> {
  const { error } = await admin().from("player_wallets").upsert(
    {
      account_id: accountId,
      total_slices: 0,
      total_backpack_pieces: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[game-repo] ensureWalletRow", error);
    return false;
  }
  return true;
}

export async function getWalletTotals(accountId: string): Promise<WalletTotals | null> {
  const { data, error } = await admin()
    .from("player_wallets")
    .select("total_slices, total_backpack_pieces")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getWalletTotals", error);
    return null;
  }
  if (!data) {
    return { totalSlices: 0, totalBackpackPieces: 0 };
  }

  return {
    totalSlices: coerceNumber((data as { total_slices?: unknown }).total_slices, 0),
    totalBackpackPieces: coerceNumber((data as { total_backpack_pieces?: unknown }).total_backpack_pieces, 0),
  };
}

export type StudentTeamColor = "blue" | "red";

export type LeaderboardPlayerRow = {
  accountId: string;
  username: string;
  team: StudentTeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
};

export type LeaderboardTeamAggregateRow = {
  team: StudentTeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
  memberCount: number;
};

/** Max players returned in leaderboard lists (global rank beyond this cap is estimated for self). */
export const LEADERBOARD_MAX_PLAYERS = 100;

export type LeaderboardAccountSelfContext = {
  username: string;
  team: StudentTeamColor;
  totalSlices: number;
  totalBackpackPieces: number;
};

/** Account profile + wallet slices in one query for leaderboard self context. */
export async function getStudentAccountLeaderboardSelfContext(
  accountId: string,
): Promise<LeaderboardAccountSelfContext | null> {
  const { data: account, error: accountError } = await admin()
    .from("student_accounts")
    .select("username, team, player_wallets(total_slices, total_backpack_pieces)")
    .eq("id", accountId)
    .maybeSingle();

  if (accountError) {
    console.error("[game-repo] getStudentAccountLeaderboardSelfContext", accountError);
    return null;
  }

  if (!account?.username || (account.team !== "blue" && account.team !== "red")) {
    return null;
  }

  const walletRaw = (account as {
    player_wallets?:
      | { total_slices?: number; total_backpack_pieces?: number }
      | { total_slices?: number; total_backpack_pieces?: number }[]
      | null;
  }).player_wallets;
  let totalSlices = 0;
  let totalBackpackPieces = 0;
  if (Array.isArray(walletRaw)) {
    totalSlices = coerceNumber(walletRaw[0]?.total_slices, 0);
    totalBackpackPieces = coerceNumber(walletRaw[0]?.total_backpack_pieces, 0);
  } else if (walletRaw && typeof walletRaw === "object") {
    totalSlices = coerceNumber(walletRaw.total_slices, 0);
    totalBackpackPieces = coerceNumber(walletRaw.total_backpack_pieces, 0);
  }

  return {
    username: account.username as string,
    team: account.team as StudentTeamColor,
    totalSlices,
    totalBackpackPieces,
  };
}

/** Derived in memory from a single player list fetch (see leaderboard-service). */
export function computeLeaderboardTeamAggregates(
  players: LeaderboardPlayerRow[],
): LeaderboardTeamAggregateRow[] {
  const byTeam: Record<StudentTeamColor, LeaderboardTeamAggregateRow> = {
    blue: { team: "blue", totalSlices: 0, totalBackpackPieces: 0, memberCount: 0 },
    red: { team: "red", totalSlices: 0, totalBackpackPieces: 0, memberCount: 0 },
  };

  for (const player of players) {
    const bucket = byTeam[player.team];
    bucket.totalSlices += player.totalSlices;
    bucket.totalBackpackPieces += player.totalBackpackPieces;
    bucket.memberCount += 1;
  }

  const aggregates = [byTeam.blue, byTeam.red];
  aggregates.sort((a, b) => {
    if (b.totalSlices !== a.totalSlices) return b.totalSlices - a.totalSlices;
    return a.team.localeCompare(b.team);
  });

  return aggregates;
}

export async function listLeaderboardPlayerRows(
  limit = LEADERBOARD_MAX_PLAYERS,
): Promise<LeaderboardPlayerRow[] | null> {
  const { data, error } = await admin()
    .from("student_accounts")
    .select("id, username, team, player_wallets(total_slices, total_backpack_pieces)")
    .in("team", ["blue", "red"]);

  if (error) {
    console.error("[game-repo] listLeaderboardPlayerRows", error);
    return null;
  }

  const rows: LeaderboardPlayerRow[] = [];
  for (const raw of data ?? []) {
    const row = raw as {
      id?: string;
      username?: string;
      team?: string;
      player_wallets?:
        | { total_slices?: number; total_backpack_pieces?: number }
        | { total_slices?: number; total_backpack_pieces?: number }[]
        | null;
    };
    if (!row.id || !row.username || (row.team !== "blue" && row.team !== "red")) continue;

    let slices = 0;
    let backpackPieces = 0;
    const walletRaw = row.player_wallets;
    if (Array.isArray(walletRaw)) {
      slices = coerceNumber(walletRaw[0]?.total_slices, 0);
      backpackPieces = coerceNumber(walletRaw[0]?.total_backpack_pieces, 0);
    } else if (walletRaw && typeof walletRaw === "object") {
      slices = coerceNumber(walletRaw.total_slices, 0);
      backpackPieces = coerceNumber(walletRaw.total_backpack_pieces, 0);
    }

    rows.push({
      accountId: row.id,
      username: row.username,
      team: row.team,
      totalSlices: slices,
      totalBackpackPieces: backpackPieces,
    });
  }

  rows.sort((a, b) => {
    if (b.totalSlices !== a.totalSlices) return b.totalSlices - a.totalSlices;
    return a.username.localeCompare(b.username);
  });

  return rows.slice(0, Math.max(1, limit));
}
