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

function admin(): SupabaseClient {
  return getSupabaseAdmin();
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

export async function getWalletTotal(accountId: string): Promise<number | null> {
  const { data, error } = await admin()
    .from("player_wallets")
    .select("total_slices")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) {
    console.error("[game-repo] getWalletTotal", error);
    return null;
  }
  if (!data) return 0;
  return data.total_slices as number;
}

export async function ensureWalletRow(accountId: string): Promise<boolean> {
  const { error } = await admin().from("player_wallets").upsert(
    { account_id: accountId, total_slices: 0, updated_at: new Date().toISOString() },
    { onConflict: "account_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[game-repo] ensureWalletRow", error);
    return false;
  }
  return true;
}

export async function incrementWalletSlices(accountId: string, delta: number): Promise<number | null> {
  const total = await getWalletTotal(accountId);
  if (total === null) return null;
  const next = Math.max(0, total + delta);
  const { data, error } = await admin()
    .from("player_wallets")
    .upsert(
      {
        account_id: accountId,
        total_slices: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id" },
    )
    .select("total_slices")
    .single();

  if (error) {
    console.error("[game-repo] incrementWalletSlices", error);
    return null;
  }
  return data.total_slices as number;
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

export async function abandonInProgressRuns(accountId: string, levelId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { error } = await admin()
    .from("player_level_runs")
    .update({ status: "abandoned", completed_at: now })
    .eq("account_id", accountId)
    .eq("level_id", levelId)
    .eq("status", "in_progress");

  if (error) {
    console.error("[game-repo] abandonInProgressRuns", error);
    return false;
  }
  return true;
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
  };
  if (completedAtIso !== undefined) {
    patch.completed_at = completedAtIso;
  }

  const { error } = await admin().from("player_level_runs").update(patch).eq("id", runId);

  if (error) {
    console.error("[game-repo] updateRunProgress", error);
    return false;
  }
  return true;
}

export async function insertTaskAttempt(
  runId: string,
  taskId: string,
  awardedSlices: number,
): Promise<boolean> {
  const { error } = await admin().from("player_task_attempts").insert({
    run_id: runId,
    task_id: taskId,
    awarded_slices: awardedSlices,
  });
  if (error) {
    console.error("[game-repo] insertTaskAttempt", error);
    return false;
  }
  return true;
}

export function placeholderFromPayload(payload: Record<string, unknown>): string {
  const p = payload?.placeholderLabel;
  return typeof p === "string" ? p : "";
}
