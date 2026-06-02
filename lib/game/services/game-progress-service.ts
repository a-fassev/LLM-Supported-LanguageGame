import {
  completeQuestRun,
  completeSceneOnce,
  createQuestRun,
  ensureWalletRow,
  getActiveQuestRun,
  getCompletedQuestIds,
  getCompletedSceneIds,
  getQuestRunById,
  getWalletTotals,
  incrementWalletTotals,
  updateQuestRunPosition,
  type QuestRunRow,
} from "@/lib/game/repositories/game-progress-repository";
import { gameClientMessages as msg } from "@/lib/game/clientMessages";
import {
  findCatalogScene,
  findCatalogQuest,
  loadContentCatalog,
  type CatalogScene,
  type ContentCatalog,
} from "@/lib/game/content/catalog-loader";
import { meetsScoredPizzaMinimum, parsePizzaRewardRules, slicesFromRatio } from "@/lib/game/scoring/pizzaReward";
import { evaluateTaskAttempt } from "@/lib/game/scoring/evaluateTaskAttempt";
import { buildTaskOutcome, type TaskOutcomeDto } from "@/lib/game/task-outcome-messages";

export type BootstrapQuestDto = {
  id: string;
  title: string;
  order: number;
  kind: "main" | "bonus";
  requiresQuestId: string | null;
  autoStartQuestId: string | null;
};

export type BootstrapChapterDto = {
  id: string;
  title: string;
  order: number;
  quests: BootstrapQuestDto[];
};

export type BootstrapResult =
  | {
      ok: true;
      totalSlices: number;
      totalBackpackPieces: number;
      completedQuestIds: string[];
      chapters: BootstrapChapterDto[];
    }
  | { ok: false; status: number; error: string; code?: string; details?: Record<string, unknown> };

function toBootstrapChapters(): Promise<BootstrapChapterDto[]> {
  return loadContentCatalog().then((catalog) =>
    catalog.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      order: chapter.order,
      quests: chapter.questsExpanded.map((quest) => ({
        id: quest.id,
        title: quest.title,
        order: quest.order,
        kind: quest.kind,
        requiresQuestId: quest.requiresQuestId,
        autoStartQuestId: quest.autoStartQuestId,
      })),
    })),
  );
}

function isQuestLockedForAccount(
  catalog: ContentCatalog,
  chapterId: string,
  questId: string,
  completedQuestIds: Set<string>,
): boolean {
  const chapterIndex = catalog.chapters.findIndex((chapter) => chapter.id === chapterId);
  if (chapterIndex < 0) return true;
  if (chapterIndex > 0) {
    const previousChapter = catalog.chapters[chapterIndex - 1];
    const requiredMainQuestIds = previousChapter.questsExpanded
      .filter((quest) => quest.kind !== "bonus")
      .map((quest) => quest.id);
    const previousChapterComplete = requiredMainQuestIds.every((requiredQuestId) =>
      completedQuestIds.has(requiredQuestId),
    );
    if (!previousChapterComplete) return true;
  }

  const quest = findCatalogQuest(catalog, chapterId, questId);
  if (!quest) return true;
  if (quest.requiresQuestId && !completedQuestIds.has(quest.requiresQuestId)) {
    return true;
  }
  return false;
}

export async function bootstrapGameState(accountId: string): Promise<BootstrapResult> {
  const okEnsure = await ensureWalletRow(accountId);
  if (!okEnsure) return { ok: false, status: 500, error: msg.couldNotLoadWallet };

  const wallet = await getWalletTotals(accountId);
  if (wallet === null) return { ok: false, status: 500, error: msg.couldNotLoadWallet };
  const [chapters, completedQuestIds] = await Promise.all([
    toBootstrapChapters().catch((error) => {
      console.error("[game-service] bootstrap catalog", error);
      return null;
    }),
    getCompletedQuestIds(accountId),
  ]);
  if (!chapters) {
    return {
      ok: false,
      status: 500,
      error: msg.couldNotLoadCatalog,
      code: "catalog_unavailable",
    };
  }
  if (completedQuestIds === null) {
    return { ok: false, status: 500, error: msg.couldNotLoadRun };
  }

  return {
    ok: true,
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    completedQuestIds,
    chapters,
  };
}

export type RunSceneDto = {
  id: string;
  scene_type: "story" | "task";
  screen_type: string;
  background: string;
  content: Record<string, unknown>;
  scoring?: Record<string, unknown>;
};

export type RunSnapshotDto = {
  runId: string;
  chapterId: string;
  questId: string;
  currentSceneId: string;
  status: "in_progress" | "completed" | "abandoned";
  completedSceneIds: string[];
  currentScene: RunSceneDto;
};

export type RunSnapshotResult =
  | {
      ok: true;
      totalSlices: number;
      totalBackpackPieces: number;
      run: RunSnapshotDto | null;
      taskOutcome?: TaskOutcomeDto;
    }
  | {
      ok: false;
      status: number;
      error: string;
      code?: string;
      details?: Record<string, unknown>;
      taskOutcome?: TaskOutcomeDto;
    };

type BuildSnapshotOptions = {
  includeWallet?: boolean;
};

function sceneToDto(scene: CatalogScene): RunSceneDto {
  return {
    id: scene.id,
    scene_type: scene.scene_type,
    screen_type: scene.screen_type,
    background: scene.background,
    content: scene.content as Record<string, unknown>,
    ...(scene.scene_type === "task" ? { scoring: scene.scoring as Record<string, unknown> } : {}),
  };
}

async function buildSnapshotFromRun(
  accountId: string,
  run: QuestRunRow | null,
  options?: BuildSnapshotOptions,
): Promise<RunSnapshotResult> {
  const wallet = options?.includeWallet === false ? null : await getWalletTotals(accountId);
  if (options?.includeWallet !== false && wallet === null) {
    return { ok: false, status: 500, error: msg.couldNotLoadWallet };
  }
  if (!run) {
    return {
      ok: true,
      totalSlices: wallet?.totalSlices ?? 0,
      totalBackpackPieces: wallet?.totalBackpackPieces ?? 0,
      run: null,
    };
  }

  const catalog = await loadContentCatalog().catch((error) => {
    console.error("[game-service] run snapshot catalog", error);
    return null;
  });
  if (!catalog) return { ok: false, status: 500, error: msg.couldNotLoadCatalog, code: "catalog_unavailable" };

  const scene = findCatalogScene(catalog, run.chapterId, run.questId, run.currentSceneId);
  if (!scene) {
    return {
      ok: false,
      status: 500,
      error: msg.couldNotLoadRun,
      code: "scene_missing",
      details: { runId: run.runId, sceneId: run.currentSceneId },
    };
  }

  const completedSceneIds = (await getCompletedSceneIds(run.runId)) ?? [];
  return {
    ok: true,
    totalSlices: wallet?.totalSlices ?? 0,
    totalBackpackPieces: wallet?.totalBackpackPieces ?? 0,
    run: {
      runId: run.runId,
      chapterId: run.chapterId,
      questId: run.questId,
      currentSceneId: run.currentSceneId,
      status: run.status,
      completedSceneIds,
      currentScene: sceneToDto(scene),
    },
  };
}

export async function getRunSnapshot(accountId: string): Promise<RunSnapshotResult> {
  const ensured = await ensureWalletRow(accountId);
  if (!ensured) return { ok: false, status: 500, error: msg.couldNotLoadWallet };
  const run = await getActiveQuestRun(accountId);
  return buildSnapshotFromRun(accountId, run);
}

export async function startOrResumeRun(
  accountId: string,
  chapterId: string,
  questId: string,
): Promise<RunSnapshotResult> {
  const ensured = await ensureWalletRow(accountId);
  if (!ensured) return { ok: false, status: 500, error: msg.couldNotStartRun };

  const existingRun = await getActiveQuestRun(accountId);
  if (existingRun) {
    if (existingRun.chapterId !== chapterId || existingRun.questId !== questId) {
      return {
        ok: false,
        status: 409,
        error: msg.activeRunExists,
        code: "active_run_exists",
        details: {
          existingRunId: existingRun.runId,
          existingChapterId: existingRun.chapterId,
          existingQuestId: existingRun.questId,
        },
      };
    }
    return buildSnapshotFromRun(accountId, existingRun);
  }

  const catalog = await loadContentCatalog().catch((error) => {
    console.error("[game-service] start run catalog", error);
    return null;
  });
  if (!catalog) return { ok: false, status: 500, error: msg.couldNotLoadCatalog, code: "catalog_unavailable" };

  const quest = findCatalogQuest(catalog, chapterId, questId);
  if (!quest) {
    return {
      ok: false,
      status: 404,
      error: msg.runNotFound,
      code: "quest_not_found",
      details: { chapterId, questId },
    };
  }
  const completedQuestIds = await getCompletedQuestIds(accountId);
  if (completedQuestIds === null) {
    return { ok: false, status: 500, error: msg.couldNotLoadRun };
  }
  if (isQuestLockedForAccount(catalog, chapterId, questId, new Set(completedQuestIds))) {
    return {
      ok: false,
      status: 409,
      error: msg.questLocked,
      code: "quest_locked",
      details: {
        chapterId,
        questId,
        requiresQuestId: quest.requiresQuestId,
      },
    };
  }
  const firstScene = quest.scenes[0];
  const created = await createQuestRun(accountId, chapterId, questId, firstScene.id);
  if (!created) return { ok: false, status: 500, error: msg.couldNotStartRun };
  return buildSnapshotFromRun(accountId, created);
}

function nextSceneIdInQuest(scene: CatalogScene, questScenes: CatalogScene[]): string | null {
  const next = questScenes.find((s) => s.sceneNumber === scene.sceneNumber + 1);
  return next?.id ?? null;
}

async function moveRunAfterCompletion(run: QuestRunRow, currentScene: CatalogScene): Promise<boolean> {
  const catalog = await loadContentCatalog().catch(() => null);
  if (!catalog) return false;
  const quest = findCatalogQuest(catalog, run.chapterId, run.questId);
  if (!quest) return false;
  const nextSceneId = nextSceneIdInQuest(currentScene, quest.scenes);
  if (nextSceneId) {
    return updateQuestRunPosition(run.runId, nextSceneId);
  }
  return completeQuestRun(run.runId);
}

export async function advanceStoryScene(
  accountId: string,
  runId: string,
  sceneId: string,
): Promise<RunSnapshotResult> {
  const run = await getQuestRunById(runId);
  if (!run || run.accountId !== accountId || run.status !== "in_progress") {
    return { ok: false, status: 404, error: msg.runNotFound, code: "run_not_found" };
  }
  if (run.currentSceneId !== sceneId) {
    return { ok: false, status: 409, error: msg.invalidSceneProgression, code: "scene_out_of_sync" };
  }

  const catalog = await loadContentCatalog().catch(() => null);
  if (!catalog) return { ok: false, status: 500, error: msg.couldNotLoadCatalog, code: "catalog_unavailable" };
  const scene = findCatalogScene(catalog, run.chapterId, run.questId, sceneId);
  if (!scene || scene.scene_type !== "story") {
    return { ok: false, status: 400, error: msg.invalidSceneProgression, code: "scene_not_story" };
  }

  const completion = await completeSceneOnce({
    runId: run.runId,
    accountId: run.accountId,
    chapterId: run.chapterId,
    questId: run.questId,
    sceneId: scene.id,
    sceneType: "story",
    taskType: null,
    awardedSlices: 0,
    awardedBackpackPieces: 0,
  });
  if (!completion.completionId && !completion.inserted) {
    return { ok: false, status: 500, error: msg.couldNotAdvanceScene };
  }

  const moved = await moveRunAfterCompletion(run, scene);
  if (!moved) return { ok: false, status: 500, error: msg.couldNotAdvanceScene };
  const updatedRun = await getQuestRunById(run.runId);
  return buildSnapshotFromRun(accountId, updatedRun);
}

export async function completeTaskScene(
  accountId: string,
  runId: string,
  sceneId: string,
  options?: { attemptPayload?: unknown },
): Promise<RunSnapshotResult> {
  const run = await getQuestRunById(runId);
  if (!run || run.accountId !== accountId || run.status !== "in_progress") {
    return { ok: false, status: 404, error: msg.runNotFound, code: "run_not_found" };
  }
  if (run.currentSceneId !== sceneId) {
    return { ok: false, status: 409, error: msg.invalidSceneProgression, code: "scene_out_of_sync" };
  }

  const catalog = await loadContentCatalog().catch(() => null);
  if (!catalog) return { ok: false, status: 500, error: msg.couldNotLoadCatalog, code: "catalog_unavailable" };
  const scene = findCatalogScene(catalog, run.chapterId, run.questId, sceneId);
  if (!scene || scene.scene_type !== "task") {
    return { ok: false, status: 400, error: msg.invalidSceneProgression, code: "scene_not_task" };
  }

  const pizzaRules = parsePizzaRewardRules({ pizza: scene.scoring.pizza });
  const taskTypeMap: Record<string, string | undefined> = {
    cloze: "ClozeText",
    multiple_choice: "MultipleChoice",
    drag_drop: "DragDrop",
    matching: "Matching",
    error_spotting: "ErrorSpotting",
  };

  let ratio = 1;
  if (pizzaRules.kind !== "flat") {
    const attemptTaskType = taskTypeMap[scene.screen_type];
    if (!attemptTaskType) {
      return { ok: false, status: 501, error: msg.taskEvaluationNotImplemented, code: "task_eval_not_implemented" };
    }
    const evaluated = evaluateTaskAttempt(
      attemptTaskType,
      scene.content.task as Record<string, unknown>,
      options?.attemptPayload,
    );
    if (!evaluated.ok) {
      return { ok: false, status: evaluated.status, error: evaluated.error, code: evaluated.code };
    }
    ratio = Math.max(0, Math.min(1, evaluated.ratio));
  }

  if (!meetsScoredPizzaMinimum(ratio, pizzaRules)) {
    const taskOutcome = buildTaskOutcome({
      passed: false,
      ratio,
      awardedSlices: 0,
      awardedBackpackPieces: 0,
    });
    return {
      ok: false,
      status: 409,
      error: msg.taskMinRatioNotMet,
      code: "task_min_ratio_not_met",
      taskOutcome,
      details: { taskOutcome },
    };
  }
  const awardedSlices = slicesFromRatio(ratio, pizzaRules);
  const awardedBackpack = Math.max(0, Math.trunc(scene.scoring.backpack.pieces));

  const completion = await completeSceneOnce({
    runId: run.runId,
    accountId: run.accountId,
    chapterId: run.chapterId,
    questId: run.questId,
    sceneId: scene.id,
    sceneType: "task",
    taskType: scene.screen_type,
    awardedSlices,
    awardedBackpackPieces: awardedBackpack,
    taskRatio: ratio,
    taskAttemptPayload: options?.attemptPayload,
  });
  if (!completion.completionId && !completion.inserted) {
    return { ok: false, status: 500, error: msg.couldNotCompleteTask };
  }

  if (completion.inserted) {
    const walletUpdated = await incrementWalletTotals(accountId, awardedSlices, awardedBackpack);
    if (!walletUpdated) return { ok: false, status: 500, error: msg.couldNotLoadWallet };
  }

  const moved = await moveRunAfterCompletion(run, scene);
  if (!moved) return { ok: false, status: 500, error: msg.couldNotCompleteTask };
  const updatedRun = await getQuestRunById(run.runId);
  const snapshot = await buildSnapshotFromRun(accountId, updatedRun);
  if (!snapshot.ok) return snapshot;

  const taskOutcome = buildTaskOutcome({
    passed: true,
    ratio,
    awardedSlices,
    awardedBackpackPieces: awardedBackpack,
  });
  return { ...snapshot, taskOutcome };
}
