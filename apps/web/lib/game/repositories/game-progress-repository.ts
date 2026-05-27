import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type GameChapterRow = {
  id: string;
  slug: string;
  display_name: string;
  order_index: number;
  theme_payload: Record<string, unknown>;
  is_active: boolean;
};

export type GameQuestRow = {
  id: string;
  chapter_id: string;
  slug: string;
  display_name: string;
  order_index: number;
  unlock_rules: Record<string, unknown>;
  meta_payload: Record<string, unknown>;
  is_active: boolean;
};

export type GameQuestStepRow = {
  id: string;
  quest_id: string;
  order_index: number;
  step_kind: "cutscene" | "task";
  task_type: string | null;
  template_key: string;
  logical_task_key: string | null;
  content_payload: Record<string, unknown>;
  reward_rules: Record<string, unknown>;
  is_active: boolean;
};

export type PlayerQuestRunRow = {
  id: string;
  account_id: string;
  chapter_id: string;
  quest_id: string;
  status: "in_progress" | "completed" | "abandoned";
  current_step_order_index: number;
  current_task_order_index: number;
  started_at: string;
  completed_at: string | null;
};

export type WalletTotals = {
  totalSlices: number;
  totalBackpackPieces: number;
};

export type RpcCompleteQuestStepTaskResult =
  | {
      ok: true;
      awardedSlices: number;
      totalSlices: number;
      totalBackpackPieces: number;
      awardedBackpackPieces: number;
      questComplete: boolean;
      currentTaskOrderIndex: number;
      currentStepOrderIndex: number;
      nextTaskStepId: string | null;
    }
  | { ok: false; code: string; error: string };

export type RpcAdvanceQuestCutsceneResult = RpcCompleteQuestStepTaskResult;

function admin(): SupabaseClient {
  return getSupabaseAdmin();
}

function coerceNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Supabase RPC jsonb is usually an object; some clients may stringify or use camelCase keys. */
function asJsonObject(data: unknown): Record<string, unknown> | null {
  if (data == null) return null;
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }
  if (typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return null;
}

function readIntFromRow(row: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
    const v = row[key];
    if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
    if (typeof v === "string") {
      const t = v.trim();
      if (t === "") continue;
      const n = Number(t);
      if (Number.isFinite(n)) return Math.trunc(n);
    }
  }
  return 0;
}

function readOkFlag(row: Record<string, unknown>): boolean | null {
  const v = row.ok;
  if (v === true) return true;
  if (v === false) return false;
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

function readBoolFromRow(row: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
    const v = row[key];
    if (v === true) return true;
    if (v === false) return false;
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return false;
}

export async function listActiveChaptersOrdered(): Promise<GameChapterRow[] | null> {
  const { data, error } = await admin()
    .from("game_chapters")
    .select("id, slug, display_name, order_index, theme_payload, is_active")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[game-repo] listActiveChaptersOrdered", error);
    return null;
  }
  return (data ?? []) as GameChapterRow[];
}

export async function listActiveQuestsByChapterIds(chapterIds: string[]): Promise<GameQuestRow[] | null> {
  if (chapterIds.length === 0) return [];
  const { data, error } = await admin()
    .from("game_quests")
    .select("id, chapter_id, slug, display_name, order_index, unlock_rules, meta_payload, is_active")
    .in("chapter_id", chapterIds)
    .eq("is_active", true)
    .order("chapter_id", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[game-repo] listActiveQuestsByChapterIds", error);
    return null;
  }
  return (data ?? []) as GameQuestRow[];
}

export async function listStepsForQuest(questId: string): Promise<GameQuestStepRow[] | null> {
  const { data, error } = await admin()
    .from("game_quest_steps")
    .select(
      "id, quest_id, order_index, step_kind, task_type, template_key, logical_task_key, content_payload, reward_rules, is_active",
    )
    .eq("quest_id", questId)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[game-repo] listStepsForQuest", error);
    return null;
  }
  return (data ?? []) as GameQuestStepRow[];
}

export async function listStepsForQuests(questIds: string[]): Promise<GameQuestStepRow[] | null> {
  if (questIds.length === 0) return [];
  const { data, error } = await admin()
    .from("game_quest_steps")
    .select(
      "id, quest_id, order_index, step_kind, task_type, template_key, logical_task_key, content_payload, reward_rules, is_active",
    )
    .in("quest_id", questIds)
    .eq("is_active", true)
    .order("quest_id", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[game-repo] listStepsForQuests", error);
    return null;
  }
  return (data ?? []) as GameQuestStepRow[];
}

export function bucketQuestsByChapterId(rows: GameQuestRow[]): Map<string, GameQuestRow[]> {
  const map = new Map<string, GameQuestRow[]>();
  for (const row of rows) {
    const list = map.get(row.chapter_id);
    if (list) list.push(row);
    else map.set(row.chapter_id, [row]);
  }
  return map;
}

export function bucketStepsByQuestId(rows: GameQuestStepRow[]): Map<string, GameQuestStepRow[]> {
  const map = new Map<string, GameQuestStepRow[]>();
  for (const row of rows) {
    const list = map.get(row.quest_id);
    if (list) list.push(row);
    else map.set(row.quest_id, [row]);
  }
  return map;
}

export async function getQuestById(questId: string): Promise<GameQuestRow | null> {
  const { data, error } = await admin()
    .from("game_quests")
    .select("id, chapter_id, slug, display_name, order_index, unlock_rules, meta_payload, is_active")
    .eq("id", questId)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getQuestById", error);
    return null;
  }
  if (!data) return null;
  return data as GameQuestRow;
}

export async function getQuestRunById(runId: string): Promise<PlayerQuestRunRow | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .select(
      "id, account_id, chapter_id, quest_id, status, current_step_order_index, current_task_order_index, started_at, completed_at",
    )
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getQuestRunById", error);
    return null;
  }
  if (!data) return null;
  return data as PlayerQuestRunRow;
}

export async function findInProgressRun(accountId: string, questId: string): Promise<PlayerQuestRunRow | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .select(
      "id, account_id, chapter_id, quest_id, status, current_step_order_index, current_task_order_index, started_at, completed_at",
    )
    .eq("account_id", accountId)
    .eq("quest_id", questId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] findInProgressRun", error);
    return null;
  }
  if (!data) return null;
  return data as PlayerQuestRunRow;
}

export async function findLatestInProgressRunForAccount(accountId: string): Promise<PlayerQuestRunRow | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .select(
      "id, account_id, chapter_id, quest_id, status, current_step_order_index, current_task_order_index, started_at, completed_at",
    )
    .eq("account_id", accountId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] findLatestInProgressRunForAccount", error);
    return null;
  }
  if (!data) return null;
  return data as PlayerQuestRunRow;
}

export async function abandonAllInProgressRunsForAccount(accountId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await admin()
    .from("player_quest_runs")
    .update({ status: "abandoned", completed_at: now })
    .eq("account_id", accountId)
    .eq("status", "in_progress");

  if (error) {
    console.error("[game-repo] abandonAllInProgressRunsForAccount", error);
    return false;
  }
  return true;
}

export async function insertRun(accountId: string, chapterId: string, questId: string): Promise<PlayerQuestRunRow | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .insert({
      account_id: accountId,
      chapter_id: chapterId,
      quest_id: questId,
      status: "in_progress",
      current_step_order_index: 0,
      current_task_order_index: 0,
    })
    .select(
      "id, account_id, chapter_id, quest_id, status, current_step_order_index, current_task_order_index, started_at, completed_at",
    )
    .single();

  if (error) {
    console.error("[game-repo] insertRun", error);
    return null;
  }
  return data as PlayerQuestRunRow;
}

export async function updateRunProgress(
  runId: string,
  nextTaskOrderIndex: number,
  nextStepOrderIndex: number,
  status: "in_progress" | "completed" | "abandoned",
  completedAtIso: string | null,
): Promise<boolean> {
  const { error } = await admin()
    .from("player_quest_runs")
    .update({
      current_task_order_index: nextTaskOrderIndex,
      current_step_order_index: nextStepOrderIndex,
      status,
      completed_at: completedAtIso,
    })
    .eq("id", runId);

  if (error) {
    console.error("[game-repo] updateRunProgress", error);
    return false;
  }
  return true;
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

export async function listCompletedQuestIds(accountId: string): Promise<string[] | null> {
  const { data, error } = await admin()
    .from("player_quest_runs")
    .select("quest_id")
    .eq("account_id", accountId)
    .eq("status", "completed");

  if (error) {
    console.error("[game-repo] listCompletedQuestIds", error);
    return null;
  }

  const set = new Set<string>();
  for (const row of data ?? []) {
    set.add((row as { quest_id: string }).quest_id);
  }
  return [...set];
}

export async function listCompletedLogicalTaskKeys(accountId: string): Promise<string[] | null> {
  const { data, error } = await admin()
    .from("player_step_attempts")
    .select("logical_task_key")
    .eq("account_id", accountId)
    .not("logical_task_key", "is", null);

  if (error) {
    console.error("[game-repo] listCompletedLogicalTaskKeys", error);
    return null;
  }

  const set = new Set<string>();
  for (const row of data ?? []) {
    const key = (row as { logical_task_key?: string | null }).logical_task_key;
    if (typeof key === "string" && key.length > 0) set.add(key);
  }
  return [...set];
}

export async function rpcCompleteQuestStepTask(
  accountId: string,
  runId: string,
  stepId: string,
  pAwardedSlices: number,
): Promise<RpcCompleteQuestStepTaskResult> {
  const clamped = Math.max(0, Math.min(5, Math.trunc(pAwardedSlices)));
  const { data, error } = await admin().rpc("complete_quest_step_task", {
    p_account_id: accountId,
    p_run_id: runId,
    p_step_id: stepId,
    p_awarded_slices: clamped,
  });

  if (error) {
    console.error("[game-repo] rpcCompleteQuestStepTask", error);
    return {
      ok: false,
      code: "rpc_transport_error",
      error: error.message || "RPC request failed",
    };
  }

  const row = asJsonObject(data);
  const okFlag = row !== null ? readOkFlag(row) : null;
  if (row === null || okFlag === null) {
    console.error("[game-repo] rpcCompleteQuestStepTask unexpected payload", data);
    return {
      ok: false,
      code: "rpc_payload_error",
      error: "Unexpected RPC response",
    };
  }

  if (!okFlag) {
    return {
      ok: false,
      code: typeof row.code === "string" ? row.code : "rpc_error",
      error: typeof row.error === "string" ? row.error : "Step completion failed",
    };
  }

  let nextTaskStepId: string | null = null;
  const nextRaw = row.next_task_step_id ?? row.nextTaskStepId;
  if (nextRaw !== null && nextRaw !== undefined) {
    if (typeof nextRaw === "string") nextTaskStepId = nextRaw;
    else if (typeof nextRaw === "number") nextTaskStepId = String(nextRaw);
  }

  return {
    ok: true,
    awardedSlices: readIntFromRow(row, "awarded_slices", "awardedSlices"),
    totalSlices: readIntFromRow(row, "total_slices", "totalSlices"),
    totalBackpackPieces: readIntFromRow(row, "total_backpack_pieces", "totalBackpackPieces"),
    awardedBackpackPieces: readIntFromRow(row, "awarded_backpack_pieces", "awardedBackpackPieces"),
    questComplete: readBoolFromRow(row, "quest_complete", "questComplete"),
    currentTaskOrderIndex: readIntFromRow(row, "current_task_order_index", "currentTaskOrderIndex"),
    currentStepOrderIndex: readIntFromRow(row, "current_step_order_index", "currentStepOrderIndex"),
    nextTaskStepId,
  };
}

/** Progress past a cutscene step (no puzzle rewards); keeps wallet unchanged. */
export async function rpcAdvanceQuestCutsceneStep(
  accountId: string,
  runId: string,
  stepId: string,
): Promise<RpcAdvanceQuestCutsceneResult> {
  const { data, error } = await admin().rpc("advance_quest_cutscene_step", {
    p_account_id: accountId,
    p_run_id: runId,
    p_step_id: stepId,
  });

  if (error) {
    console.error("[game-repo] rpcAdvanceQuestCutsceneStep", error);
    return {
      ok: false,
      code: "rpc_transport_error",
      error: error.message || "RPC request failed",
    };
  }

  const row = asJsonObject(data);
  const okFlag = row !== null ? readOkFlag(row) : null;
  if (row === null || okFlag === null) {
    console.error("[game-repo] rpcAdvanceQuestCutsceneStep unexpected payload", data);
    return {
      ok: false,
      code: "rpc_payload_error",
      error: "Unexpected RPC response",
    };
  }

  if (!okFlag) {
    return {
      ok: false,
      code: typeof row.code === "string" ? row.code : "rpc_error",
      error: typeof row.error === "string" ? row.error : "Cutscene advance failed",
    };
  }

  let nextTaskStepId: string | null = null;
  const nextRaw = row.next_task_step_id ?? row.nextTaskStepId;
  if (nextRaw !== null && nextRaw !== undefined) {
    if (typeof nextRaw === "string") nextTaskStepId = nextRaw;
    else if (typeof nextRaw === "number") nextTaskStepId = String(nextRaw);
  }

  return {
    ok: true,
    awardedSlices: readIntFromRow(row, "awarded_slices", "awardedSlices"),
    totalSlices: readIntFromRow(row, "total_slices", "totalSlices"),
    totalBackpackPieces: readIntFromRow(row, "total_backpack_pieces", "totalBackpackPieces"),
    awardedBackpackPieces: readIntFromRow(row, "awarded_backpack_pieces", "awardedBackpackPieces"),
    questComplete: readBoolFromRow(row, "quest_complete", "questComplete"),
    currentTaskOrderIndex: readIntFromRow(row, "current_task_order_index", "currentTaskOrderIndex"),
    currentStepOrderIndex: readIntFromRow(row, "current_step_order_index", "currentStepOrderIndex"),
    nextTaskStepId,
  };
}

/** Rotates gate id on each successful evaluation attempt (UPSERT conflict on active run/step). */
export async function upsertFreitextLlmEvaluationGate(
  accountId: string,
  runId: string,
  stepId: string,
  ttlMinutes: number,
  pizzaSlicesAward: number,
): Promise<{ token: string } | null> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + Math.max(1, ttlMinutes) * 60_000).toISOString();
  const slices = Math.max(0, Math.min(5, Math.trunc(pizzaSlicesAward)));

  const { error } = await admin()
    .from("player_freitext_llm_gates")
    .upsert(
      {
        id: token,
        account_id: accountId,
        run_id: runId,
        step_id: stepId,
        expires_at: expiresAt,
        pizza_slices_award: slices,
      },
      { onConflict: "run_id,step_id" },
    );

  if (error) {
    console.error("[game-repo] upsertFreitextLlmEvaluationGate", error);
    return null;
  }

  return { token };
}

/** Validates gate and returns stored pizza award (for scored pizza rules). */
export async function fetchFreitextLlmEvaluationGate(
  accountId: string,
  runId: string,
  stepId: string,
  gateToken: string,
): Promise<{ token: string; pizzaSlicesAward: number } | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await admin()
    .from("player_freitext_llm_gates")
    .select("id, pizza_slices_award")
    .eq("id", gateToken)
    .eq("account_id", accountId)
    .eq("run_id", runId)
    .eq("step_id", stepId)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] fetchFreitextLlmEvaluationGate", error);
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const row = data as { id?: unknown; pizza_slices_award?: unknown };
  const id = typeof row.id === "string" ? row.id : null;
  if (!id) return null;
  const rawAward = row.pizza_slices_award;
  const pizzaSlicesAward =
    typeof rawAward === "number" && Number.isFinite(rawAward) ? Math.trunc(rawAward) : 0;
  return { token: id, pizzaSlicesAward };
}

/** Removes gate after authoritative step completion succeeds. Idempotent-ish: missing rows stay quiet. */
export async function deleteFreitextLlmEvaluationGate(accountId: string, gateToken: string): Promise<boolean> {
  const { error } = await admin().from("player_freitext_llm_gates").delete().eq("id", gateToken).eq("account_id", accountId);

  if (error) {
    console.error("[game-repo] deleteFreitextLlmEvaluationGate", error);
    return false;
  }
  return true;
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
