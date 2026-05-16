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
    .select("id, chapter_id, slug, display_name, order_index, unlock_rules, is_active")
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
    .select("id, chapter_id, slug, display_name, order_index, unlock_rules, is_active")
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
  awardedSlices: number,
): Promise<RpcCompleteQuestStepTaskResult> {
  const { data, error } = await admin().rpc("complete_quest_step_task", {
    p_account_id: accountId,
    p_run_id: runId,
    p_step_id: stepId,
    p_awarded_slices: awardedSlices,
  });

  if (error) {
    console.error("[game-repo] rpcCompleteQuestStepTask", error);
    return {
      ok: false,
      code: "rpc_transport_error",
      error: error.message || "RPC request failed",
    };
  }

  const row = data as Record<string, unknown> | null;
  if (!row || typeof row.ok !== "boolean") {
    console.error("[game-repo] rpcCompleteQuestStepTask unexpected payload", data);
    return {
      ok: false,
      code: "rpc_payload_error",
      error: "Unexpected RPC response",
    };
  }

  if (!row.ok) {
    return {
      ok: false,
      code: typeof row.code === "string" ? row.code : "rpc_error",
      error: typeof row.error === "string" ? row.error : "Step completion failed",
    };
  }

  const coerceInt = (v: unknown, fallback = 0): number =>
    typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;

  let nextTaskStepId: string | null = null;
  if (row.next_task_step_id !== null && row.next_task_step_id !== undefined) {
    if (typeof row.next_task_step_id === "string") nextTaskStepId = row.next_task_step_id;
    else if (typeof row.next_task_step_id === "number") nextTaskStepId = String(row.next_task_step_id);
  }

  return {
    ok: true,
    totalSlices: coerceInt(row.total_slices, 0),
    totalBackpackPieces: coerceInt(row.total_backpack_pieces, 0),
    awardedBackpackPieces: coerceInt(row.awarded_backpack_pieces, 0),
    questComplete: Boolean(row.quest_complete),
    currentTaskOrderIndex: coerceInt(row.current_task_order_index, 0),
    currentStepOrderIndex: coerceInt(row.current_step_order_index, 0),
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

  const row = data as Record<string, unknown> | null;
  if (!row || typeof row.ok !== "boolean") {
    console.error("[game-repo] rpcAdvanceQuestCutsceneStep unexpected payload", data);
    return {
      ok: false,
      code: "rpc_payload_error",
      error: "Unexpected RPC response",
    };
  }

  if (!row.ok) {
    return {
      ok: false,
      code: typeof row.code === "string" ? row.code : "rpc_error",
      error: typeof row.error === "string" ? row.error : "Cutscene advance failed",
    };
  }

  const coerceInt = (v: unknown, fallback = 0): number =>
    typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;

  let nextTaskStepId: string | null = null;
  if (row.next_task_step_id !== null && row.next_task_step_id !== undefined) {
    if (typeof row.next_task_step_id === "string") nextTaskStepId = row.next_task_step_id;
    else if (typeof row.next_task_step_id === "number") nextTaskStepId = String(row.next_task_step_id);
  }

  return {
    ok: true,
    totalSlices: coerceInt(row.total_slices, 0),
    totalBackpackPieces: coerceInt(row.total_backpack_pieces, 0),
    awardedBackpackPieces: coerceInt(row.awarded_backpack_pieces, 0),
    questComplete: Boolean(row.quest_complete),
    currentTaskOrderIndex: coerceInt(row.current_task_order_index, 0),
    currentStepOrderIndex: coerceInt(row.current_step_order_index, 0),
    nextTaskStepId,
  };
}
