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
import {
  isChapterManuallyLocked,
  isQuestProgressionLockedForAccount,
} from "@/lib/game/quest-progression-lock";
import { isQuestCompleted } from "@/lib/game/unlock-display";
import { resolveCatalogSceneForRun } from "@/lib/game/tasks/matching/resolve-matching-scene-task";
import { gameClientMessages as msg } from "@/lib/game/clientMessages";
import {
  findCatalogScene,
  findCatalogQuest,
  loadContentCatalog,
  type CatalogScene,
  type ContentCatalog,
} from "@/lib/game/content/catalog-loader";
import { sanitizeSceneContentForClient } from "@/lib/game/content/sanitize-task-payload-for-client";
import { parsePizzaRewardRules, slicesFromRatio } from "@/lib/game/scoring/pizzaReward";
import { meetsTaskSceneCompletionMinimum } from "@/lib/game/tasks/freitext/meets-freitext-completion-minimum";
import { evaluateTaskAttempt } from "@/lib/game/scoring/evaluateTaskAttempt";
import { isGameFinaleCatalogQuest } from "@/lib/game/game-finale";
import { buildTaskOutcome, type TaskOutcomeDto } from "@/lib/game/task-outcome-messages";
import { buildFreitextRetryTaskOutcome } from "@/lib/game/tasks/freitext/build-freitext-retry-task-outcome";
import { evaluateFreitextLlmScene } from "@/lib/game/tasks/freitext/evaluate-freitext-llm-scene";
import type { BootstrapChapterDto, BootstrapQuestDto } from "@/lib/api-client";

export type { BootstrapChapterDto, BootstrapQuestDto };

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
      locked: chapter.locked,
      reference: chapter.reference,
      gameFinale: chapter.gameFinale ?? false,
      background: chapter.background,
      quests: chapter.questsExpanded.map((quest) => ({
        id: quest.id,
        title: quest.title,
        order: quest.order,
        kind: quest.kind,
        requiresQuestId: quest.requiresQuestId,
        background: quest.background,
      })),
    })),
  );
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
  sceneNumber: number;
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
  canRetreat: boolean;
  /** Last quest of a `gameFinale` chapter — use with `status === "completed"` for finale overlay. */
  isGameFinaleQuest: boolean;
  currentScene: RunSceneDto;
  /** Background key of the next catalog scene, when one exists (for client preload). */
  nextSceneBackground: string | null;
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
  catalog?: ContentCatalog;
};

function runBlockedByChapterLock(
  catalog: ContentCatalog,
  chapterId: string,
  questId: string,
): RunSnapshotResult {
  return {
    ok: false,
    status: 409,
    error: msg.chapterLocked,
    code: "chapter_locked",
    details: { chapterId, questId },
  };
}

async function loadCatalogForRun(): Promise<ContentCatalog | null> {
  return loadContentCatalog().catch((error) => {
    console.error("[game-service] catalog load", error);
    return null;
  });
}

function sceneToDto(scene: CatalogScene): RunSceneDto {
  const rawContent = scene.content as Record<string, unknown>;
  return {
    id: scene.id,
    sceneNumber: scene.sceneNumber,
    scene_type: scene.scene_type,
    screen_type: scene.screen_type,
    background: scene.background,
    content: sanitizeSceneContentForClient(scene.scene_type, scene.screen_type, rawContent),
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

  const catalog =
    options?.catalog ??
    (await loadCatalogForRun());
  if (!catalog) return { ok: false, status: 500, error: msg.couldNotLoadCatalog, code: "catalog_unavailable" };

  if (run.status === "in_progress" && isChapterManuallyLocked(catalog, run.chapterId)) {
    return runBlockedByChapterLock(catalog, run.chapterId, run.questId);
  }

  const catalogScene = findCatalogScene(catalog, run.chapterId, run.questId, run.currentSceneId);
  if (!catalogScene) {
    return {
      ok: false,
      status: 500,
      error: msg.couldNotLoadRun,
      code: "scene_missing",
      details: { runId: run.runId, sceneId: run.currentSceneId },
    };
  }

  const scene = await resolveCatalogSceneForRun(run.runId, catalogScene);
  if (!scene) {
    return {
      ok: false,
      status: 500,
      error: msg.couldNotMaterializeMatching,
      code: "materialization_failed",
    };
  }

  const completedSceneIds = (await getCompletedSceneIds(run.runId)) ?? [];
  const quest = findCatalogQuest(catalog, run.chapterId, run.questId);
  const canRetreat = quest ? previousSceneIdInQuest(scene, quest.scenes) !== null : false;
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
      canRetreat,
      isGameFinaleQuest: isGameFinaleCatalogQuest(catalog, run.chapterId, run.questId),
      currentScene: sceneToDto(scene),
      nextSceneBackground: quest ? nextSceneBackgroundInQuest(scene, quest.scenes) : null,
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
    const resumeCatalog = await loadCatalogForRun();
    if (!resumeCatalog) {
      return { ok: false, status: 500, error: msg.couldNotLoadCatalog, code: "catalog_unavailable" };
    }
    if (isChapterManuallyLocked(resumeCatalog, existingRun.chapterId)) {
      return runBlockedByChapterLock(resumeCatalog, existingRun.chapterId, existingRun.questId);
    }
    const resumeCompletedQuestIds = await getCompletedQuestIds(accountId);
    if (resumeCompletedQuestIds === null) {
      return { ok: false, status: 500, error: msg.couldNotLoadRun };
    }
    const resumeQuest = findCatalogQuest(
      resumeCatalog,
      existingRun.chapterId,
      existingRun.questId,
    );
    if (
      resumeQuest &&
      isQuestCompleted(existingRun.chapterId, resumeQuest, new Set(resumeCompletedQuestIds))
    ) {
      return {
        ok: false,
        status: 409,
        error: msg.questAlreadyCompleted,
        code: "quest_already_completed",
        details: { chapterId: existingRun.chapterId, questId: existingRun.questId },
      };
    }
    return buildSnapshotFromRun(accountId, existingRun, { catalog: resumeCatalog });
  }

  const catalog = await loadCatalogForRun();
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
  if (isChapterManuallyLocked(catalog, chapterId)) {
    return runBlockedByChapterLock(catalog, chapterId, questId);
  }
  if (isQuestProgressionLockedForAccount(catalog, chapterId, questId, new Set(completedQuestIds))) {
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
  if (isQuestCompleted(chapterId, quest, new Set(completedQuestIds))) {
    return {
      ok: false,
      status: 409,
      error: msg.questAlreadyCompleted,
      code: "quest_already_completed",
      details: { chapterId, questId },
    };
  }
  const firstScene = quest.scenes[0];
  const created = await createQuestRun(accountId, chapterId, questId, firstScene.id);
  if (!created) {
    const racedRun = await getActiveQuestRun(accountId);
    if (racedRun?.chapterId === chapterId && racedRun.questId === questId) {
      if (isChapterManuallyLocked(catalog, racedRun.chapterId)) {
        return runBlockedByChapterLock(catalog, racedRun.chapterId, racedRun.questId);
      }
      return buildSnapshotFromRun(accountId, racedRun, { catalog });
    }
    if (racedRun) {
      return {
        ok: false,
        status: 409,
        error: msg.activeRunExists,
        code: "active_run_exists",
        details: {
          existingRunId: racedRun.runId,
          existingChapterId: racedRun.chapterId,
          existingQuestId: racedRun.questId,
        },
      };
    }
    return { ok: false, status: 500, error: msg.couldNotStartRun };
  }
  return buildSnapshotFromRun(accountId, created, { catalog });
}

function nextSceneIdInQuest(scene: CatalogScene, questScenes: CatalogScene[]): string | null {
  const next = questScenes.find((s) => s.sceneNumber === scene.sceneNumber + 1);
  return next?.id ?? null;
}

function nextSceneBackgroundInQuest(scene: CatalogScene, questScenes: CatalogScene[]): string | null {
  const next = questScenes.find((s) => s.sceneNumber === scene.sceneNumber + 1);
  return next?.background ?? null;
}

function previousSceneIdInQuest(scene: CatalogScene, questScenes: CatalogScene[]): string | null {
  const previous = questScenes.find((s) => s.sceneNumber === scene.sceneNumber - 1);
  return previous?.id ?? null;
}

export async function retreatRunScene(
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

  if (isChapterManuallyLocked(catalog, run.chapterId)) {
    return runBlockedByChapterLock(catalog, run.chapterId, run.questId);
  }

  const quest = findCatalogQuest(catalog, run.chapterId, run.questId);
  const scene = findCatalogScene(catalog, run.chapterId, run.questId, sceneId);
  if (!quest || !scene) {
    return { ok: false, status: 400, error: msg.invalidSceneProgression, code: "scene_missing" };
  }

  const previousSceneId = previousSceneIdInQuest(scene, quest.scenes);
  if (!previousSceneId) {
    return {
      ok: false,
      status: 409,
      error: msg.retreatNotAllowed,
      code: "retreat_not_allowed",
    };
  }

  const moved = await updateQuestRunPosition(run.runId, previousSceneId);
  if (!moved) return { ok: false, status: 500, error: msg.couldNotRetreatScene };

  const updatedRun = await getQuestRunById(run.runId);
  return buildSnapshotFromRun(accountId, updatedRun);
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

  if (isChapterManuallyLocked(catalog, run.chapterId)) {
    return runBlockedByChapterLock(catalog, run.chapterId, run.questId);
  }

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

  if (isChapterManuallyLocked(catalog, run.chapterId)) {
    return runBlockedByChapterLock(catalog, run.chapterId, run.questId);
  }

  const catalogScene = findCatalogScene(catalog, run.chapterId, run.questId, sceneId);
  if (!catalogScene || catalogScene.scene_type !== "task") {
    return { ok: false, status: 400, error: msg.invalidSceneProgression, code: "scene_not_task" };
  }

  const scene = await resolveCatalogSceneForRun(runId, catalogScene);
  if (!scene) {
    return {
      ok: false,
      status: 500,
      error: msg.couldNotMaterializeMatching,
      code: "materialization_failed",
    };
  }
  if (scene.scene_type !== "task") {
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

  const smokeAutoPass = process.env.GAME_SMOKE_AUTO_PASS === "true";
  const skipEval = smokeAutoPass;
  let ratio = 1;
  let freitextRetryFeedback: { summaryFeedback: string; nextStepAdvice?: string } | null = null;

  const shouldEvaluateTask =
    !skipEval && (scene.screen_type === "free_text" || pizzaRules.kind !== "flat");

  if (shouldEvaluateTask) {
    if (scene.screen_type === "free_text") {
      const evaluated = await evaluateFreitextLlmScene(
        {
          task: scene.content.task as Record<string, unknown>,
          instruction: scene.content.instruction,
          referenceDocument: scene.content.referenceDocument,
        },
        options?.attemptPayload,
      );
      if (!evaluated.ok) {
        return { ok: false, status: evaluated.status, error: evaluated.error, code: evaluated.code };
      }
      ratio = evaluated.ratio;
      freitextRetryFeedback = evaluated.feedback;
    } else {
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
  }

  if (
    !meetsTaskSceneCompletionMinimum({
      ratio,
      screenType: scene.screen_type,
      pizzaRules,
      taskPayload:
        scene.screen_type === "free_text"
          ? (scene.content.task as Record<string, unknown>)
          : undefined,
      sceneInstruction:
        scene.screen_type === "free_text"
          ? (scene.content.instruction as string | undefined)
          : undefined,
    })
  ) {
    const taskOutcome =
      scene.screen_type === "free_text" && freitextRetryFeedback
        ? buildFreitextRetryTaskOutcome({
            ratio,
            summaryFeedback: freitextRetryFeedback.summaryFeedback,
            nextStepAdvice: freitextRetryFeedback.nextStepAdvice,
          })
        : buildTaskOutcome({
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

  const walletAwarded = completion.inserted;
  const taskOutcome = buildTaskOutcome({
    passed: true,
    ratio,
    awardedSlices: walletAwarded ? awardedSlices : 0,
    awardedBackpackPieces: walletAwarded ? awardedBackpack : 0,
    rewardsAlreadyClaimed: !walletAwarded,
  });
  return { ...snapshot, taskOutcome };
}
