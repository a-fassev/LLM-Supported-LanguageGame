import { randomPizzaSliceAward } from "@/lib/game/mock-scoring";
import type { GameLevelRow, GameTaskRow } from "@/lib/game/repositories/game-progress-repository";
import {
  abandonAllInProgressRunsForAccount,
  bucketTasksByLevelId,
  ensureWalletRow,
  findInProgressRun,
  findLatestInProgressRunForAccount,
  getLevelById,
  getRunById,
  getWalletTotals,
  insertRun,
  listActiveLevelsOrdered,
  listCompletedLevelIds,
  listTasksForLevel,
  listTasksForLevels,
  placeholderFromPayload,
  rpcCompleteGameTask,
  updateRunProgress,
} from "@/lib/game/repositories/game-progress-repository";

export type GameTaskDto = {
  id: string;
  orderIndex: number;
  taskType: string;
  placeholderLabel: string;
};

export type GameLevelClientDto = {
  id: string;
  slug: string;
  displayName: string;
  orderIndex: number;
  requiredTotalSlices: number;
  isUnlocked: boolean;
  hasCompletedAnyRun: boolean;
  tasks: GameTaskDto[];
};

export type ActiveRunClientDto = {
  runId: string;
  levelId: string;
  levelSlug: string;
  currentTaskOrderIndex: number;
  taskCount: number;
};

export type BootstrapResult =
  | {
      ok: true;
      totalSlices: number;
      totalBackpackPieces: number;
      levels: GameLevelClientDto[];
      activeRun: ActiveRunClientDto | null;
    }
  | { ok: false; status: number; error: string; code?: string };

export type StartLevelResult =
  | {
      ok: true;
      runId: string;
      levelId: string;
      levelSlug: string;
      displayName: string;
      totalSlices: number;
      totalBackpackPieces: number;
      tasks: GameTaskDto[];
      currentTaskOrderIndex: number;
    }
  | { ok: false; status: number; error: string; code?: string };

export type CompleteTaskResult =
  | {
      ok: true;
      awardedSlices: number;
      awardedBackpackPieces: number;
      totalSlices: number;
      totalBackpackPieces: number;
      levelComplete: boolean;
      currentTaskOrderIndex: number;
      currentTaskId: string | null;
    }
  | { ok: false; status: number; error: string; code?: string };

export type FinishRunResult =
  | { ok: true; totalSlices: number; totalBackpackPieces: number }
  | { ok: false; status: number; error: string; code?: string };

export type GetRunResult =
  | {
      ok: true;
      runId: string;
      levelId: string;
      levelSlug: string;
      displayName: string;
      status: string;
      totalSlices: number;
      totalBackpackPieces: number;
      tasks: GameTaskDto[];
      currentTaskOrderIndex: number;
    }
  | { ok: false; status: number; error: string; code?: string };

function mapTaskRow(row: GameTaskRow): GameTaskDto {
  const payload = (row.prompt_payload ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    orderIndex: row.order_index,
    taskType: row.task_type,
    placeholderLabel: placeholderFromPayload(payload),
  };
}

function isUnlockedForPlayer(
  level: GameLevelRow,
  sortedLevels: GameLevelRow[],
  completedLevelIds: Set<string>,
  walletSlices: number,
): boolean {
  const idx = sortedLevels.findIndex((l) => l.id === level.id);
  if (idx <= 0) return true;
  const prev = sortedLevels[idx - 1];
  const prevDone = completedLevelIds.has(prev.id);
  return prevDone && walletSlices >= level.required_total_slices;
}

function rpcFailureStatus(code: string): number {
  if (code === "run_not_found") return 404;
  if (code === "rpc_transport_error") return 503;
  if (code === "rpc_payload_error" || code === "no_tasks") return 500;
  return 400;
}

/** Safe copy for API responses; internal RPC/DB detail is logged server-side only. */
function clientMessageForTaskRpcFailure(code: string, internalMessage: string): string {
  if (code === "rpc_transport_error") {
    return "The game server is temporarily unavailable. Please try again.";
  }
  if (code === "rpc_payload_error") {
    return "Could not update your progress. Please try again.";
  }
  return internalMessage;
}

export async function bootstrapGameState(accountId: string): Promise<BootstrapResult> {
  const okEnsure = await ensureWalletRow(accountId);
  if (!okEnsure) return { ok: false, status: 500, error: "Could not load wallet" };

  const levels = await listActiveLevelsOrdered();
  if (!levels) return { ok: false, status: 500, error: "Could not load levels" };

  const wallet = await getWalletTotals(accountId);
  if (wallet === null) return { ok: false, status: 500, error: "Could not load wallet" };

  const completedList = await listCompletedLevelIds(accountId);
  if (!completedList) return { ok: false, status: 500, error: "Could not load progress" };

  const completedSet = new Set(completedList);
  const sorted = [...levels].sort((a, b) => a.order_index - b.order_index);

  const allTasks = await listTasksForLevels(sorted.map((l) => l.id));
  if (!allTasks) return { ok: false, status: 500, error: "Could not load tasks" };

  const tasksByLevel = bucketTasksByLevelId(allTasks);

  const levelDtos: GameLevelClientDto[] = [];
  for (const L of sorted) {
    const tasksRows = tasksByLevel.get(L.id) ?? [];

    levelDtos.push({
      id: L.id,
      slug: L.slug,
      displayName: L.display_name,
      orderIndex: L.order_index,
      requiredTotalSlices: L.required_total_slices,
      isUnlocked: isUnlockedForPlayer(L, sorted, completedSet, wallet.totalSlices),
      hasCompletedAnyRun: completedSet.has(L.id),
      tasks: tasksRows.map(mapTaskRow),
    });
  }

  let activeRun: ActiveRunClientDto | null = null;
  const runRow = await findLatestInProgressRunForAccount(accountId);
  if (runRow) {
    const levelMeta = sorted.find((l) => l.id === runRow.level_id);
    if (levelMeta) {
      const tasks = tasksByLevel.get(runRow.level_id) ?? [];
      if (tasks.length === 0) {
        console.warn(
          "[game-progress] in-progress run references level with no active tasks",
          runRow.id,
          runRow.level_id,
        );
      }
      activeRun = {
        runId: runRow.id,
        levelId: runRow.level_id,
        levelSlug: levelMeta.slug,
        currentTaskOrderIndex: runRow.current_task_order_index,
        taskCount: tasks.length,
      };
    }
  }

  return {
    ok: true,
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    levels: levelDtos,
    activeRun,
  };
}

export async function startOrResumeLevel(accountId: string, levelId: string): Promise<StartLevelResult> {
  if (!(await ensureWalletRow(accountId)))
    return { ok: false, status: 500, error: "Could not load wallet" };

  const level = await getLevelById(levelId);
  if (!level || !level.is_active) return { ok: false, status: 404, error: "Level not found", code: "level_not_found" };

  const levels = await listActiveLevelsOrdered();
  if (!levels) return { ok: false, status: 500, error: "Could not load levels" };

  const wallet = await getWalletTotals(accountId);
  if (wallet === null) return { ok: false, status: 500, error: "Could not load wallet" };

  const completedList = await listCompletedLevelIds(accountId);
  if (!completedList) return { ok: false, status: 500, error: "Could not load progress" };

  const sorted = [...levels].sort((a, b) => a.order_index - b.order_index);
  const completedSet = new Set(completedList);
  if (!isUnlockedForPlayer(level, sorted, completedSet, wallet.totalSlices)) {
    return { ok: false, status: 403, error: "Level is locked", code: "level_locked" };
  }

  let run = await findInProgressRun(accountId, levelId);
  if (!run) {
    const abandoned = await abandonAllInProgressRunsForAccount(accountId);
    if (!abandoned) return { ok: false, status: 500, error: "Could not start run" };
    run = await insertRun(accountId, levelId);
    if (!run) return { ok: false, status: 500, error: "Could not start run" };
  }

  const tasksRows = await listTasksForLevel(levelId);
  if (!tasksRows || tasksRows.length === 0)
    return { ok: false, status: 500, error: "Level has no tasks" };

  return {
    ok: true,
    runId: run.id,
    levelId: level.id,
    levelSlug: level.slug,
    displayName: level.display_name,
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    tasks: tasksRows.map(mapTaskRow),
    currentTaskOrderIndex: run.current_task_order_index,
  };
}

export async function completeGameTask(
  accountId: string,
  runId: string,
  taskId: string,
): Promise<CompleteTaskResult> {
  const awarded = randomPizzaSliceAward();
  const rpc = await rpcCompleteGameTask(accountId, runId, taskId, awarded);
  if (!rpc.ok) {
    if (rpc.code === "rpc_transport_error" || rpc.code === "rpc_payload_error") {
      console.error("[game-progress] completeGameTask RPC failure", rpc.code, rpc.error);
    }
    return {
      ok: false,
      status: rpcFailureStatus(rpc.code),
      error: clientMessageForTaskRpcFailure(rpc.code, rpc.error),
      code: rpc.code,
    };
  }
  return {
    ok: true,
    awardedSlices: awarded,
    awardedBackpackPieces: rpc.awardedBackpackPieces,
    totalSlices: rpc.totalSlices,
    totalBackpackPieces: rpc.totalBackpackPieces,
    levelComplete: rpc.levelComplete,
    currentTaskOrderIndex: rpc.currentTaskOrderIndex,
    currentTaskId: rpc.currentTaskId,
  };
}

export async function finishGameRun(accountId: string, runId: string): Promise<FinishRunResult> {
  const run = await getRunById(runId);
  if (!run || run.account_id !== accountId) {
    return { ok: false, status: 404, error: "Run not found", code: "run_not_found" };
  }

  const wallet = await getWalletTotals(accountId);
  if (wallet === null) return { ok: false, status: 500, error: "Could not load wallet" };

  if (run.status === "completed") {
    return {
      ok: true,
      totalSlices: wallet.totalSlices,
      totalBackpackPieces: wallet.totalBackpackPieces,
    };
  }

  const tasksRows = await listTasksForLevel(run.level_id);
  if (!tasksRows) return { ok: false, status: 500, error: "Could not load tasks" };

  if (run.status === "in_progress" && run.current_task_order_index >= tasksRows.length) {
    const nowIso = new Date().toISOString();
    const ok = await updateRunProgress(runId, run.current_task_order_index, "completed", nowIso);
    if (!ok) return { ok: false, status: 500, error: "Could not update run" };
    return {
      ok: true,
      totalSlices: wallet.totalSlices,
      totalBackpackPieces: wallet.totalBackpackPieces,
    };
  }

  return { ok: false, status: 400, error: "Level not finished yet", code: "run_incomplete" };
}

export async function getGameRun(accountId: string, runId: string): Promise<GetRunResult> {
  const run = await getRunById(runId);
  if (!run || run.account_id !== accountId) {
    return { ok: false, status: 404, error: "Run not found", code: "run_not_found" };
  }

  const level = await getLevelById(run.level_id);
  if (!level) return { ok: false, status: 500, error: "Level missing" };

  const tasksRows = await listTasksForLevel(run.level_id);
  if (!tasksRows) return { ok: false, status: 500, error: "Could not load tasks" };

  const wallet = await getWalletTotals(accountId);
  if (wallet === null) return { ok: false, status: 500, error: "Could not load wallet" };

  return {
    ok: true,
    runId: run.id,
    levelId: run.level_id,
    levelSlug: level.slug,
    displayName: level.display_name,
    status: run.status,
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    tasks: tasksRows.map(mapTaskRow),
    currentTaskOrderIndex: run.current_task_order_index,
  };
}
