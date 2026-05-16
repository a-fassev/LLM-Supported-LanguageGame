import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type GameLevelRow = {
  id: string;
  slug: string;
  display_name: string;
  order_index: number;
  required_total_slices: number;
  is_active: boolean;
};

export type GameTaskRow = {
  id: string;
  level_id: string;
  order_index: number;
  task_type: string;
  prompt_payload: Record<string, unknown>;
  is_active: boolean;
};

export type PlayerRunRow = {
  id: string;
  account_id: string;
  level_id: string;
  status: "in_progress" | "completed" | "abandoned";
  current_task_order_index: number;
  started_at: string;
  completed_at: string | null;
};

export type RpcCompleteTaskResult =
  | {
      ok: true;
      totalSlices: number;
      totalBackpackPieces: number;
      awardedBackpackPieces: number;
      levelComplete: boolean;
      currentTaskOrderIndex: number;
      currentTaskId: string | null;
    }
  | { ok: false; code: string; error: string };

function admin(): SupabaseClient {
  return getSupabaseAdmin();
}

/** Group rows returned from listTasksForLevels (sorted by level_id, order_index). */
export function bucketTasksByLevelId(rows: GameTaskRow[]): Map<string, GameTaskRow[]> {
  const map = new Map<string, GameTaskRow[]>();
  for (const r of rows) {
    const list = map.get(r.level_id);
    if (list) list.push(r);
    else map.set(r.level_id, [r]);
  }
  return map;
}

export async function listActiveLevelsOrdered(): Promise<GameLevelRow[] | null> {
  const { data, error } = await admin()
    .from("game_levels")
    .select("id, slug, display_name, order_index, required_total_slices, is_active")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[game-repo] listActiveLevelsOrdered", error);
    return null;
  }
  return (data ?? []) as GameLevelRow[];
}

export async function listTasksForLevel(levelId: string): Promise<GameTaskRow[] | null> {
  const { data, error } = await admin()
    .from("game_tasks")
    .select("id, level_id, order_index, task_type, prompt_payload, is_active")
    .eq("level_id", levelId)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[game-repo] listTasksForLevel", error);
    return null;
  }
  return (data ?? []) as GameTaskRow[];
}

/** Single query for bootstrap / multi-level views (avoids N+1). */
export async function listTasksForLevels(levelIds: string[]): Promise<GameTaskRow[] | null> {
  if (levelIds.length === 0) return [];
  const { data, error } = await admin()
    .from("game_tasks")
    .select("id, level_id, order_index, task_type, prompt_payload, is_active")
    .in("level_id", levelIds)
    .eq("is_active", true)
    .order("level_id", { ascending: true })
    .order("order_index", { ascending: true });

  if (error) {
    console.error("[game-repo] listTasksForLevels", error);
    return null;
  }
  return (data ?? []) as GameTaskRow[];
}

export async function getLevelById(levelId: string): Promise<GameLevelRow | null> {
  const { data, error } = await admin()
    .from("game_levels")
    .select("id, slug, display_name, order_index, required_total_slices, is_active")
    .eq("id", levelId)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getLevelById", error);
    return null;
  }
  if (!data) return null;
  return data as GameLevelRow;
}

export type WalletTotals = {
  totalSlices: number;
  totalBackpackPieces: number;
};

export async function getWalletTotals(accountId: string): Promise<WalletTotals | null> {
  const { data, error } = await admin()
    .from("player_wallets")
    .select("total_slices,total_backpack_pieces")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getWalletTotals", error);
    return null;
  }
  if (!data)
    return { totalSlices: 0, totalBackpackPieces: 0 };
  return {
    totalSlices: coerceNumber(data.total_slices, 0),
    totalBackpackPieces: coerceNumber((data as { total_backpack_pieces?: unknown }).total_backpack_pieces, 0),
  };
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

/**
 * Atomically records attempt, increments wallet, advances run (Postgres function + row lock).
 */
export async function rpcCompleteGameTask(
  accountId: string,
  runId: string,
  taskId: string,
  awardedSlices: number,
): Promise<RpcCompleteTaskResult> {
  const { data, error } = await admin().rpc("complete_game_task", {
    p_account_id: accountId,
    p_run_id: runId,
    p_task_id: taskId,
    p_awarded_slices: awardedSlices,
  });

  if (error) {
    console.error("[game-repo] rpcCompleteGameTask", error);
    return {
      ok: false,
      code: "rpc_transport_error",
      error: error.message || "RPC request failed",
    };
  }

  const row = data as Record<string, unknown> | null;
  if (!row || typeof row.ok !== "boolean") {
    console.error("[game-repo] rpcCompleteGameTask unexpected payload", data);
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
      error: typeof row.error === "string" ? row.error : "Task completion failed",
    };
  }

  const coerceInt = (v: unknown, fallback = 0): number =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  let nextId: string | null = null;
  if (row.current_task_id !== null && row.current_task_id !== undefined) {
    if (typeof row.current_task_id === "string") nextId = row.current_task_id;
    else if (typeof row.current_task_id === "number") nextId = String(row.current_task_id);
  }

  const coerceIntStrict = (v: unknown, fallback = 0): number =>
    typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;

  return {
    ok: true,
    totalSlices: coerceInt(row.total_slices, 0),
    totalBackpackPieces: coerceIntStrict(row.total_backpack_pieces, 0),
    awardedBackpackPieces: coerceIntStrict(row.awarded_backpack_pieces, 0),
    levelComplete: Boolean(row.level_complete),
    currentTaskOrderIndex: coerceInt(row.current_task_order_index, 0),
    currentTaskId: nextId,
  };
}

/** Returns level ids that have at least one completed run for the account. */
export async function listCompletedLevelIds(accountId: string): Promise<string[] | null> {
  const { data, error } = await admin()
    .from("player_level_runs")
    .select("level_id")
    .eq("account_id", accountId)
    .eq("status", "completed");

  if (error) {
    console.error("[game-repo] listCompletedLevelIds", error);
    return null;
  }
  const set = new Set<string>();
  for (const row of data ?? []) {
    set.add((row as { level_id: string }).level_id);
  }
  return [...set];
}

export async function findInProgressRun(
  accountId: string,
  levelId: string,
): Promise<PlayerRunRow | null> {
  const { data, error } = await admin()
    .from("player_level_runs")
    .select("id, account_id, level_id, status, current_task_order_index, started_at, completed_at")
    .eq("account_id", accountId)
    .eq("level_id", levelId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] findInProgressRun", error);
    return null;
  }
  if (!data) return null;
  return data as PlayerRunRow;
}

export async function findLatestInProgressRunForAccount(accountId: string): Promise<PlayerRunRow | null> {
  const { data, error } = await admin()
    .from("player_level_runs")
    .select("id, account_id, level_id, status, current_task_order_index, started_at, completed_at")
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
  return data as PlayerRunRow;
}

export async function getRunById(runId: string): Promise<PlayerRunRow | null> {
  const { data, error } = await admin()
    .from("player_level_runs")
    .select("id, account_id, level_id, status, current_task_order_index, started_at, completed_at")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getRunById", error);
    return null;
  }
  if (!data) return null;
  return data as PlayerRunRow;
}

/** Abandon any in-progress runs for this account (e.g. starting a different level). */
export async function abandonAllInProgressRunsForAccount(accountId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await admin()
    .from("player_level_runs")
    .update({ status: "abandoned", completed_at: now })
    .eq("account_id", accountId)
    .eq("status", "in_progress");

  if (error) {
    console.error("[game-repo] abandonAllInProgressRunsForAccount", error);
    return false;
  }
  return true;
}

export async function insertRun(accountId: string, levelId: string): Promise<PlayerRunRow | null> {
  const { data, error } = await admin()
    .from("player_level_runs")
    .insert({
      account_id: accountId,
      level_id: levelId,
      status: "in_progress",
      current_task_order_index: 0,
    })
    .select("id, account_id, level_id, status, current_task_order_index, started_at, completed_at")
    .single();

  if (error) {
    console.error("[game-repo] insertRun", error);
    return null;
  }
  return data as PlayerRunRow;
}

export async function updateRunProgress(
  runId: string,
  nextTaskOrderIndex: number,
  status: "in_progress" | "completed" | "abandoned",
  completedAtIso: string | null,
): Promise<boolean> {
  const patch: Record<string, unknown> = {
    current_task_order_index: nextTaskOrderIndex,
    status,
    completed_at: completedAtIso,
  };

  const { error } = await admin().from("player_level_runs").update(patch).eq("id", runId);

  if (error) {
    console.error("[game-repo] updateRunProgress", error);
    return false;
  }
  return true;
}

export function placeholderFromPayload(payload: Record<string, unknown>): string {
  const p = payload?.placeholderLabel;
  return typeof p === "string" ? p : "";
}
