import type { SupabaseClient } from "@supabase/supabase-js";
import { compareLeaderboardPlayers } from "@/lib/game/leaderboard-player-sort";
import { toQuestProgressId } from "@/lib/game/quest-progress-id";
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

export type QuestRunStatus = "in_progress" | "completed" | "abandoned";

export type QuestRunRow = {
  runId: string;
  accountId: string;
  chapterId: string;
  questId: string;
  currentSceneId: string;
  status: QuestRunStatus;
};

export type SceneCompletionInsert = {
  runId: string;
  accountId: string;
  chapterId: string;
  questId: string;
  sceneId: string;
  sceneType: "story" | "task";
  taskType: string | null;
  awardedSlices: number;
  awardedBackpackPieces: number;
  taskAttemptPayload?: unknown;
  taskRatio?: number;
};

export async function getActiveQuestRun(accountId: string): Promise<QuestRunRow | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .select("id, account_id, chapter_id, quest_id, current_scene_id, status")
    .eq("account_id", accountId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getActiveQuestRun", error);
    return null;
  }
  if (!data) return null;

  return {
    runId: data.id as string,
    accountId: data.account_id as string,
    chapterId: data.chapter_id as string,
    questId: data.quest_id as string,
    currentSceneId: data.current_scene_id as string,
    status: data.status as QuestRunStatus,
  };
}

export async function getQuestRunById(runId: string): Promise<QuestRunRow | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .select("id, account_id, chapter_id, quest_id, current_scene_id, status")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getQuestRunById", error);
    return null;
  }
  if (!data) return null;
  return {
    runId: data.id as string,
    accountId: data.account_id as string,
    chapterId: data.chapter_id as string,
    questId: data.quest_id as string,
    currentSceneId: data.current_scene_id as string,
    status: data.status as QuestRunStatus,
  };
}

export async function createQuestRun(
  accountId: string,
  chapterId: string,
  questId: string,
  firstSceneId: string,
): Promise<QuestRunRow | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .insert({
      account_id: accountId,
      chapter_id: chapterId,
      quest_id: questId,
      current_scene_id: firstSceneId,
      status: "in_progress",
    })
    .select("id, account_id, chapter_id, quest_id, current_scene_id, status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return getActiveQuestRun(accountId);
    }
    console.error("[game-repo] createQuestRun", error);
    return null;
  }
  return {
    runId: data.id as string,
    accountId: data.account_id as string,
    chapterId: data.chapter_id as string,
    questId: data.quest_id as string,
    currentSceneId: data.current_scene_id as string,
    status: data.status as QuestRunStatus,
  };
}

export async function updateQuestRunPosition(runId: string, currentSceneId: string): Promise<boolean> {
  const { error } = await admin()
    .from("player_quest_runs")
    .update({
      current_scene_id: currentSceneId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId);
  if (error) {
    console.error("[game-repo] updateQuestRunPosition", error);
    return false;
  }
  return true;
}

export async function completeQuestRun(runId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await admin()
    .from("player_quest_runs")
    .update({
      status: "completed",
      completed_at: now,
      updated_at: now,
    })
    .eq("id", runId);
  if (error) {
    console.error("[game-repo] completeQuestRun", error);
    return false;
  }
  return true;
}

export async function abandonQuestRun(runId: string): Promise<boolean> {
  const { error } = await admin()
    .from("player_quest_runs")
    .update({
      status: "abandoned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .eq("status", "in_progress");
  if (error) {
    console.error("[game-repo] abandonQuestRun", error);
    return false;
  }
  return true;
}

/** Quest ids with at least one completed run for this account. */
export async function getCompletedQuestIds(accountId: string): Promise<string[] | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .select("chapter_id, quest_id")
    .eq("account_id", accountId)
    .eq("status", "completed");

  if (error) {
    console.error("[game-repo] getCompletedQuestIds", error);
    return null;
  }

  const ids = new Set<string>();
  for (const row of data ?? []) {
    const chapterId = (row as { chapter_id?: unknown }).chapter_id;
    const questId = (row as { quest_id?: unknown }).quest_id;
    if (typeof chapterId !== "string" || chapterId.length === 0) continue;
    if (typeof questId !== "string" || questId.length === 0) continue;
    ids.add(toQuestProgressId(chapterId, questId));
  }
  return [...ids];
}

export type GetSceneMaterializationResult =
  | { ok: true; materializedTask: Record<string, unknown> | null }
  | { ok: false };

export async function getSceneMaterialization(
  runId: string,
  sceneId: string,
): Promise<GetSceneMaterializationResult> {
  const { data, error } = await admin()
    .from("player_scene_materializations")
    .select("materialized_task")
    .eq("run_id", runId)
    .eq("scene_id", sceneId)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getSceneMaterialization", error);
    return { ok: false };
  }
  const raw = (data as { materialized_task?: unknown } | null)?.materialized_task;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: true, materializedTask: null };
  }
  return { ok: true, materializedTask: raw as Record<string, unknown> };
}

/** Inserts materialization only when none exists (avoids concurrent overwrite races). */
export async function insertSceneMaterializationIfAbsent(
  runId: string,
  sceneId: string,
  materializedTask: Record<string, unknown>,
): Promise<boolean> {
  const { error } = await admin().from("player_scene_materializations").insert({
    run_id: runId,
    scene_id: sceneId,
    materialized_task: materializedTask,
  });

  if (error) {
    if (error.code === "23505") return false;
    console.error("[game-repo] insertSceneMaterializationIfAbsent", error);
    return false;
  }
  return true;
}

export async function getRecentCompletedQuestRuns(
  accountId: string,
  limit = 5,
): Promise<QuestRunRow[] | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .select("id, account_id, chapter_id, quest_id, current_scene_id, status")
    .eq("account_id", accountId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[game-repo] getRecentCompletedQuestRuns", error);
    return null;
  }
  if (!data?.length) return [];

  return data.map((row) => ({
    runId: row.id as string,
    accountId: row.account_id as string,
    chapterId: row.chapter_id as string,
    questId: row.quest_id as string,
    currentSceneId: row.current_scene_id as string,
    status: row.status as QuestRunStatus,
  }));
}

export async function getCompletedSceneIds(runId: string): Promise<string[] | null> {
  const { data, error } = await admin()
    .from("player_scene_completions")
    .select("scene_id")
    .eq("run_id", runId);

  if (error) {
    console.error("[game-repo] getCompletedSceneIds", error);
    return null;
  }
  const ids = (data ?? []).map((row) => String((row as { scene_id: unknown }).scene_id));
  return ids;
}

export async function completeSceneOnce(input: SceneCompletionInsert): Promise<{ inserted: boolean; completionId?: string }> {
  const { data: existing, error: existingError } = await admin()
    .from("player_scene_completions")
    .select("id")
    .eq("run_id", input.runId)
    .eq("scene_id", input.sceneId)
    .maybeSingle();
  if (existingError) {
    console.error("[game-repo] completeSceneOnce:existing", existingError);
    return { inserted: false };
  }
  if (existing?.id) {
    return { inserted: false, completionId: existing.id as string };
  }

  const { data, error } = await admin()
    .from("player_scene_completions")
    .insert({
      run_id: input.runId,
      account_id: input.accountId,
      chapter_id: input.chapterId,
      quest_id: input.questId,
      scene_id: input.sceneId,
      scene_type: input.sceneType,
      task_type: input.taskType,
      awarded_slices: input.awardedSlices,
      awarded_backpack_pieces: input.awardedBackpackPieces,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const { data: raced, error: racedError } = await admin()
        .from("player_scene_completions")
        .select("id")
        .eq("run_id", input.runId)
        .eq("scene_id", input.sceneId)
        .maybeSingle();
      if (!racedError && raced?.id) {
        return { inserted: false, completionId: raced.id as string };
      }
    }
    console.error("[game-repo] completeSceneOnce:insert", error);
    return { inserted: false };
  }

  const completionId = data.id as string;
  if (input.sceneType === "task") {
    const { error: attemptError } = await admin().from("player_task_attempts").insert({
      completion_id: completionId,
      run_id: input.runId,
      account_id: input.accountId,
      scene_id: input.sceneId,
      task_type: input.taskType ?? "",
      attempt_payload: input.taskAttemptPayload ?? null,
      ratio: input.taskRatio ?? null,
    });
    if (attemptError) {
      console.error("[game-repo] completeSceneOnce:attempt", attemptError);
    }
  }

  return { inserted: true, completionId };
}

export async function incrementWalletTotals(
  accountId: string,
  slicesDelta: number,
  backpackDelta: number,
): Promise<boolean> {
  const wallet = await getWalletTotals(accountId);
  if (!wallet) return false;
  const nextSlices = Math.max(0, wallet.totalSlices + Math.trunc(slicesDelta));
  const nextBackpack = Math.max(0, wallet.totalBackpackPieces + Math.trunc(backpackDelta));
  const { error } = await admin()
    .from("player_wallets")
    .update({
      total_slices: nextSlices,
      total_backpack_pieces: nextBackpack,
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", accountId);

  if (error) {
    console.error("[game-repo] incrementWalletTotals", error);
    return false;
  }
  return true;
}

export async function getPurchasedRoomItemIds(accountId: string): Promise<string[] | null> {
  const { data, error } = await admin()
    .from("player_room_items")
    .select("item_id")
    .eq("account_id", accountId)
    .order("purchased_at", { ascending: true });

  if (error) {
    console.error("[game-repo] getPurchasedRoomItemIds", error);
    return null;
  }

  return (data ?? [])
    .map((row) => (row as { item_id?: unknown }).item_id)
    .filter((itemId): itemId is string => typeof itemId === "string" && itemId.length > 0);
}

export async function deletePurchasedRoomItems(accountId: string): Promise<boolean> {
  const { error } = await admin().from("player_room_items").delete().eq("account_id", accountId);
  if (error) {
    console.error("[game-repo] deletePurchasedRoomItems", error);
    return false;
  }
  return true;
}

export type PurchaseRoomItemResult =
  | { ok: true }
  | { ok: false; reason: "already_purchased" | "not_enough_slices" | "wallet_update_failed" | "database_error" };

export async function purchaseRoomItem(
  accountId: string,
  itemId: string,
  cost: number,
): Promise<PurchaseRoomItemResult> {
  const walletReady = await ensureWalletRow(accountId);
  if (!walletReady) return { ok: false, reason: "database_error" };

  const { error: insertError } = await admin().from("player_room_items").insert({
    account_id: accountId,
    item_id: itemId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, reason: "already_purchased" };
    }
    console.error("[game-repo] purchaseRoomItem:insert", insertError);
    return { ok: false, reason: "database_error" };
  }

  const wallet = await getWalletTotals(accountId);
  if (!wallet) {
    await deletePurchasedRoomItem(accountId, itemId);
    return { ok: false, reason: "database_error" };
  }

  const normalizedCost = Math.max(0, Math.trunc(cost));
  if (wallet.totalSlices < normalizedCost) {
    await deletePurchasedRoomItem(accountId, itemId);
    return { ok: false, reason: "not_enough_slices" };
  }

  const { data, error: updateError } = await admin()
    .from("player_wallets")
    .update({
      total_slices: wallet.totalSlices - normalizedCost,
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", accountId)
    .eq("total_slices", wallet.totalSlices)
    .select("account_id")
    .maybeSingle();

  if (updateError || !data) {
    if (updateError) console.error("[game-repo] purchaseRoomItem:wallet", updateError);
    await deletePurchasedRoomItem(accountId, itemId);
    return { ok: false, reason: "wallet_update_failed" };
  }

  return { ok: true };
}

async function deletePurchasedRoomItem(accountId: string, itemId: string): Promise<void> {
  const { error } = await admin().from("player_room_items").delete().eq("account_id", accountId).eq("item_id", itemId);
  if (error) {
    console.error("[game-repo] deletePurchasedRoomItem", error);
  }
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

  rows.sort(compareLeaderboardPlayers);

  return rows.slice(0, Math.max(1, limit));
}
