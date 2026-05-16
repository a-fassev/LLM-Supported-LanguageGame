import {
  abandonAllInProgressRunsForAccount,
  bucketQuestsByChapterId,
  bucketStepsByQuestId,
  ensureWalletRow,
  findInProgressRun,
  findLatestInProgressRunForAccount,
  getQuestById,
  getQuestRunById,
  getWalletTotals,
  insertRun,
  listActiveChaptersOrdered,
  listActiveQuestsByChapterIds,
  listCompletedLogicalTaskKeys,
  listCompletedQuestIds,
  listStepsForQuest,
  listStepsForQuests,
  rpcCompleteQuestStepTask,
  rpcAdvanceQuestCutsceneStep,
  updateRunProgress,
  type GameQuestRow,
  type GameQuestStepRow,
} from "@/lib/game/repositories/game-progress-repository";

export type GameQuestStepDto = {
  id: string;
  orderIndex: number;
  stepKind: "cutscene" | "task";
  taskType: string | null;
  templateKey: string;
  logicalTaskKey: string | null;
  contentJson: string;
  rewardRulesJson: string;
  isTask: boolean;
};

export type GameQuestClientDto = {
  id: string;
  chapterId: string;
  slug: string;
  displayName: string;
  orderIndex: number;
  isUnlocked: boolean;
  hasCompletedAnyRun: boolean;
  unlockHint: string;
  steps: GameQuestStepDto[];
};

export type GameChapterClientDto = {
  id: string;
  slug: string;
  displayName: string;
  orderIndex: number;
  themeJson: string;
  /** False when prerequisite chapter is incomplete. Always true for first chapter slot. */
  isUnlocked: boolean;
  /** Non-empty explanation when locked. */
  unlockHint: string;
  quests: GameQuestClientDto[];
};

/**
 * Mirrors `player_quest_runs`: `currentStepOrderIndex` is the pending step ordinal;
 * `currentTaskOrderIndex` counts finished task steps (cutscene advances do not bump it).
 */
export type ActiveQuestRunClientDto = {
  runId: string;
  chapterId: string;
  questId: string;
  questSlug: string;
  currentStepOrderIndex: number;
  currentTaskOrderIndex: number;
  stepCount: number;
};

export type BootstrapResult =
  | {
      ok: true;
      totalSlices: number;
      totalBackpackPieces: number;
      chapters: GameChapterClientDto[];
      activeRun: ActiveQuestRunClientDto | null;
    }
  | { ok: false; status: number; error: string; code?: string };

export type StartQuestResult =
  | {
      ok: true;
      runId: string;
      chapterId: string;
      questId: string;
      questSlug: string;
      displayName: string;
      totalSlices: number;
      totalBackpackPieces: number;
      steps: GameQuestStepDto[];
      /** Ordinal of upcoming step among active ordered steps (cutscenes + tasks). */
      currentStepOrderIndex: number;
      /** Count of successfully completed tasks in this run (not incremented by cutscene advance). */
      currentTaskOrderIndex: number;
    }
  | { ok: false; status: number; error: string; code?: string };

export type CompleteStepTaskResult =
  | {
      ok: true;
      awardedSlices: number;
      awardedBackpackPieces: number;
      totalSlices: number;
      totalBackpackPieces: number;
      questComplete: boolean;
      currentStepOrderIndex: number;
      currentTaskOrderIndex: number;
      nextTaskStepId: string | null;
    }
  | { ok: false; status: number; error: string; code?: string };

/** Same envelope as task completion; slice award is always 0. */
export type AdvanceCutsceneStepResult = CompleteStepTaskResult;

export type FinishRunResult =
  | { ok: true; totalSlices: number; totalBackpackPieces: number }
  | { ok: false; status: number; error: string; code?: string };

/** Run snapshot for resume; step/task index semantics match ActiveQuestRunClientDto. */
export type GetRunResult =
  | {
      ok: true;
      runId: string;
      chapterId: string;
      questId: string;
      questSlug: string;
      displayName: string;
      status: string;
      totalSlices: number;
      totalBackpackPieces: number;
      steps: GameQuestStepDto[];
      currentStepOrderIndex: number;
      currentTaskOrderIndex: number;
    }
  | { ok: false; status: number; error: string; code?: string };

function mapStepRow(row: GameQuestStepRow): GameQuestStepDto {
  return {
    id: row.id,
    orderIndex: row.order_index,
    stepKind: row.step_kind,
    taskType: row.task_type,
    templateKey: row.template_key ?? "",
    logicalTaskKey: row.logical_task_key ?? null,
    contentJson: JSON.stringify(row.content_payload ?? {}),
    rewardRulesJson: JSON.stringify(row.reward_rules ?? {}),
    isTask: row.step_kind === "task",
  };
}

type UnlockRules = {
  requiredTotalSlices: number;
  prerequisiteQuestSlugs: string[];
  prerequisiteLogicalTaskKeys: string[];
};

function parseUnlockRules(quest: GameQuestRow): UnlockRules {
  const raw = (quest.unlock_rules ?? {}) as Record<string, unknown>;
  const requiredTotalSlices =
    typeof raw.requiredTotalSlices === "number"
      ? Math.max(0, Math.trunc(raw.requiredTotalSlices))
      : 0;

  const prerequisiteQuestSlugs = Array.isArray(raw.prerequisiteQuestSlugs)
    ? raw.prerequisiteQuestSlugs.filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];

  const prerequisiteLogicalTaskKeys = Array.isArray(raw.prerequisiteLogicalTaskKeys)
    ? raw.prerequisiteLogicalTaskKeys.filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];

  return {
    requiredTotalSlices,
    prerequisiteQuestSlugs,
    prerequisiteLogicalTaskKeys,
  };
}

function isUnlockedForPlayer(
  quest: GameQuestRow,
  questsBySlug: Map<string, GameQuestRow>,
  completedQuestIds: Set<string>,
  completedLogicalTaskKeys: Set<string>,
  walletSlices: number,
): boolean {
  const rules = parseUnlockRules(quest);
  if (walletSlices < rules.requiredTotalSlices)
    return false;

  for (const questSlug of rules.prerequisiteQuestSlugs) {
    const prerequisite = questsBySlug.get(questSlug);
    if (!prerequisite || !completedQuestIds.has(prerequisite.id))
      return false;
  }

  for (const taskKey of rules.prerequisiteLogicalTaskKeys) {
    if (!completedLogicalTaskKeys.has(taskKey))
      return false;
  }

  return true;
}

function formatQuestTitles(slugs: string[], questsBySlug: Map<string, GameQuestRow>): string {
  return slugs
    .map((s) => questsBySlug.get(s)?.display_name ?? s)
    .join(", ");
}

/** Human-readable blocker text for overlays (English). */
function buildQuestUnlockHint(
  quest: GameQuestRow,
  questsBySlug: Map<string, GameQuestRow>,
  completedQuestIds: Set<string>,
  completedLogicalTaskKeys: Set<string>,
  walletSlices: number,
): string {
  const rules = parseUnlockRules(quest);
  const lines: string[] = [];

  const missingSlices = rules.requiredTotalSlices - walletSlices;
  if (missingSlices > 0) {
    lines.push(`Earn ${missingSlices} more pizza slice${missingSlices === 1 ? "" : "s"} (have ${walletSlices}, need ${rules.requiredTotalSlices}).`);
  }

  const missingSlugQuests = rules.prerequisiteQuestSlugs.filter((slug) => {
    const pre = questsBySlug.get(slug);
    return !pre || !completedQuestIds.has(pre.id);
  });
  if (missingSlugQuests.length > 0) {
    lines.push(`Finish quest(s): ${formatQuestTitles(missingSlugQuests, questsBySlug)}.`);
  }

  const missingTaskKeys = rules.prerequisiteLogicalTaskKeys.filter((key) => !completedLogicalTaskKeys.has(key));
  if (missingTaskKeys.length > 0) {
    lines.push(`Complete task milestone(s): ${missingTaskKeys.join(", ")}.`);
  }

  if (lines.length === 0) {
    lines.push(`Quest "${quest.display_name}" is locked.`);
  }
  return lines.join("\n");
}

function allChapterQuestsEarnedMarks(chapterQuests: GameQuestRow[], completedQuestIds: Set<string>): boolean {
  if (chapterQuests.length === 0) return true;
  return chapterQuests.every((q) => completedQuestIds.has(q.id));
}

function rpcFailureStatus(code: string): number {
  if (code === "run_not_found") return 404;
  if (code === "rpc_transport_error") return 503;
  if (code === "rpc_payload_error" || code === "no_steps") return 500;
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

  const chapters = await listActiveChaptersOrdered();
  if (!chapters) return { ok: false, status: 500, error: "Could not load chapters" };

  const wallet = await getWalletTotals(accountId);
  if (wallet === null) return { ok: false, status: 500, error: "Could not load wallet" };

  const completedQuestList = await listCompletedQuestIds(accountId);
  if (!completedQuestList) return { ok: false, status: 500, error: "Could not load progress" };
  const completedTaskKeyList = await listCompletedLogicalTaskKeys(accountId);
  if (!completedTaskKeyList) return { ok: false, status: 500, error: "Could not load task prerequisites" };

  const chapterIds = chapters.map((c) => c.id);
  const quests = await listActiveQuestsByChapterIds(chapterIds);
  if (!quests) return { ok: false, status: 500, error: "Could not load quests" };

  const questIds = quests.map((q) => q.id);
  const allSteps = await listStepsForQuests(questIds);
  if (!allSteps) return { ok: false, status: 500, error: "Could not load quest steps" };

  const completedQuestSet = new Set(completedQuestList);
  const completedTaskKeySet = new Set(completedTaskKeyList);
  const questsBySlug = new Map(quests.map((q) => [q.slug, q]));
  const questsByChapter = bucketQuestsByChapterId(quests);
  const stepsByQuest = bucketStepsByQuestId(allSteps);

  const chaptersSorted = [...chapters].sort((a, b) => a.order_index - b.order_index);

  const chapterDtos: GameChapterClientDto[] = [];
  for (let chIdx = 0; chIdx < chaptersSorted.length; chIdx++) {
    const chapter = chaptersSorted[chIdx];
    const chapterQuestsSorted = (questsByChapter.get(chapter.id) ?? []).sort((a, b) => a.order_index - b.order_index);
    const prevChapterFullyDone =
      chIdx === 0 ||
      allChapterQuestsEarnedMarks(
        questsByChapter.get(chaptersSorted[chIdx - 1]!.id) ?? [],
        completedQuestSet,
      );

    const chapterUnlocked = prevChapterFullyDone;
    const chapterUnlockHint =
      chapterUnlocked
        ? ""
        : `Complete every quest in "${chaptersSorted[chIdx - 1]?.display_name ?? "the previous chapter"}" to unlock this chapter.`;

    const questDtos: GameQuestClientDto[] = chapterQuestsSorted.map((quest) => {
      const stepRows = stepsByQuest.get(quest.id) ?? [];
      const gatesOk = isUnlockedForPlayer(
        quest,
        questsBySlug,
        completedQuestSet,
        completedTaskKeySet,
        wallet.totalSlices,
      );
      const unlocked = chapterUnlocked && gatesOk;

      let unlockHint = "";
      if (!chapterUnlocked) {
        unlockHint = chapterUnlockHint;
      }
      else if (!gatesOk) {
        unlockHint = buildQuestUnlockHint(
          quest,
          questsBySlug,
          completedQuestSet,
          completedTaskKeySet,
          wallet.totalSlices,
        );
      }

      return {
        id: quest.id,
        chapterId: chapter.id,
        slug: quest.slug,
        displayName: quest.display_name,
        orderIndex: quest.order_index,
        isUnlocked: unlocked,
        hasCompletedAnyRun: completedQuestSet.has(quest.id),
        unlockHint,
        steps: stepRows.map(mapStepRow),
      };
    });

    chapterDtos.push({
      id: chapter.id,
      slug: chapter.slug,
      displayName: chapter.display_name,
      orderIndex: chapter.order_index,
      themeJson: JSON.stringify(chapter.theme_payload ?? {}),
      isUnlocked: chapterUnlocked,
      unlockHint: chapterUnlockHint,
      quests: questDtos,
    });
  }

  let activeRun: ActiveQuestRunClientDto | null = null;
  const runRow = await findLatestInProgressRunForAccount(accountId);
  if (runRow) {
    const questMeta = quests.find((q) => q.id === runRow.quest_id);
    if (questMeta) {
      const stepRows = stepsByQuest.get(runRow.quest_id) ?? [];
      activeRun = {
        runId: runRow.id,
        chapterId: runRow.chapter_id,
        questId: runRow.quest_id,
        questSlug: questMeta.slug,
        currentStepOrderIndex: runRow.current_step_order_index,
        currentTaskOrderIndex: runRow.current_task_order_index,
        stepCount: stepRows.length,
      };
    }
  }

  return {
    ok: true,
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    chapters: chapterDtos,
    activeRun,
  };
}

export async function startOrResumeQuest(accountId: string, questId: string): Promise<StartQuestResult> {
  if (!(await ensureWalletRow(accountId)))
    return { ok: false, status: 500, error: "Could not load wallet" };

  const quest = await getQuestById(questId);
  if (!quest || !quest.is_active) return { ok: false, status: 404, error: "Quest not found", code: "quest_not_found" };

  const chapters = await listActiveChaptersOrdered();
  if (!chapters) return { ok: false, status: 500, error: "Could not load chapters" };
  const quests = await listActiveQuestsByChapterIds(chapters.map((c) => c.id));
  if (!quests) return { ok: false, status: 500, error: "Could not load quests" };

  const wallet = await getWalletTotals(accountId);
  if (wallet === null) return { ok: false, status: 500, error: "Could not load wallet" };

  const completedQuestList = await listCompletedQuestIds(accountId);
  if (!completedQuestList) return { ok: false, status: 500, error: "Could not load progress" };
  const completedTaskKeyList = await listCompletedLogicalTaskKeys(accountId);
  if (!completedTaskKeyList) return { ok: false, status: 500, error: "Could not load task prerequisites" };

  const completedSet = new Set(completedQuestList);
  const completedTaskSet = new Set(completedTaskKeyList);
  const questsBySlug = new Map(quests.map((q) => [q.slug, q]));
  const questsByChapter = bucketQuestsByChapterId(quests);

  const chapterSlotsAscending = [...chapters].sort((a, b) => a.order_index - b.order_index);
  const chapterIndexForQuest = chapterSlotsAscending.findIndex((c) => c.id === quest.chapter_id);
  if (chapterIndexForQuest > 0) {
    const previousChapter = chapterSlotsAscending[chapterIndexForQuest - 1];
    const prevQuestRows = questsByChapter.get(previousChapter!.id) ?? [];
    if (!allChapterQuestsEarnedMarks(prevQuestRows, completedSet)) {
      return { ok: false, status: 403, error: "Chapter is locked", code: "chapter_locked" };
    }
  }

  if (!isUnlockedForPlayer(quest, questsBySlug, completedSet, completedTaskSet, wallet.totalSlices)) {
    return { ok: false, status: 403, error: "Quest is locked", code: "quest_locked" };
  }

  let run = await findInProgressRun(accountId, questId);
  if (!run) {
    const abandoned = await abandonAllInProgressRunsForAccount(accountId);
    if (!abandoned) return { ok: false, status: 500, error: "Could not start quest run" };
    run = await insertRun(accountId, quest.chapter_id, questId);
    if (!run) return { ok: false, status: 500, error: "Could not start quest run" };
  }

  const stepRows = await listStepsForQuest(questId);
  if (!stepRows || stepRows.length === 0)
    return { ok: false, status: 500, error: "Quest has no steps" };

  return {
    ok: true,
    runId: run.id,
    chapterId: quest.chapter_id,
    questId: quest.id,
    questSlug: quest.slug,
    displayName: quest.display_name,
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    steps: stepRows.map(mapStepRow),
    currentStepOrderIndex: run.current_step_order_index,
    currentTaskOrderIndex: run.current_task_order_index,
  };
}

export async function completeQuestStepTask(
  accountId: string,
  runId: string,
  stepId: string,
): Promise<CompleteStepTaskResult> {
  const rpc = await rpcCompleteQuestStepTask(accountId, runId, stepId);
  if (!rpc.ok) {
    if (rpc.code === "rpc_transport_error" || rpc.code === "rpc_payload_error") {
      console.error("[game-progress] completeQuestStepTask RPC failure", rpc.code, rpc.error);
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
    awardedSlices: rpc.awardedSlices,
    awardedBackpackPieces: rpc.awardedBackpackPieces,
    totalSlices: rpc.totalSlices,
    totalBackpackPieces: rpc.totalBackpackPieces,
    questComplete: rpc.questComplete,
    currentStepOrderIndex: rpc.currentStepOrderIndex,
    currentTaskOrderIndex: rpc.currentTaskOrderIndex,
    nextTaskStepId: rpc.nextTaskStepId,
  };
}

/** Cutscene advancement: authoritative step index progression with no puzzle rewards. */
export async function advanceQuestCutscene(
  accountId: string,
  runId: string,
  stepId: string,
): Promise<AdvanceCutsceneStepResult> {
  const rpc = await rpcAdvanceQuestCutsceneStep(accountId, runId, stepId);
  if (!rpc.ok) {
    if (rpc.code === "rpc_transport_error" || rpc.code === "rpc_payload_error") {
      console.error("[game-progress] advanceQuestCutscene RPC failure", rpc.code, rpc.error);
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
    awardedSlices: 0,
    awardedBackpackPieces: rpc.awardedBackpackPieces,
    totalSlices: rpc.totalSlices,
    totalBackpackPieces: rpc.totalBackpackPieces,
    questComplete: rpc.questComplete,
    currentStepOrderIndex: rpc.currentStepOrderIndex,
    currentTaskOrderIndex: rpc.currentTaskOrderIndex,
    nextTaskStepId: rpc.nextTaskStepId,
  };
}

export async function finishQuestRun(accountId: string, runId: string): Promise<FinishRunResult> {
  const run = await getQuestRunById(runId);
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

  const stepsRows = await listStepsForQuest(run.quest_id);
  if (!stepsRows) return { ok: false, status: 500, error: "Could not load quest steps" };

  if (run.status === "in_progress" && run.current_step_order_index >= stepsRows.length) {
    const nowIso = new Date().toISOString();
    const ok = await updateRunProgress(
      runId,
      run.current_task_order_index,
      run.current_step_order_index,
      "completed",
      nowIso,
    );
    if (!ok) return { ok: false, status: 500, error: "Could not update run" };
    return {
      ok: true,
      totalSlices: wallet.totalSlices,
      totalBackpackPieces: wallet.totalBackpackPieces,
    };
  }

  return { ok: false, status: 400, error: "Quest not finished yet", code: "run_incomplete" };
}

export async function getGameRun(accountId: string, runId: string): Promise<GetRunResult> {
  const run = await getQuestRunById(runId);
  if (!run || run.account_id !== accountId) {
    return { ok: false, status: 404, error: "Run not found", code: "run_not_found" };
  }

  const quest = await getQuestById(run.quest_id);
  if (!quest) return { ok: false, status: 500, error: "Quest missing" };

  const stepsRows = await listStepsForQuest(run.quest_id);
  if (!stepsRows) return { ok: false, status: 500, error: "Could not load quest steps" };

  const wallet = await getWalletTotals(accountId);
  if (wallet === null) return { ok: false, status: 500, error: "Could not load wallet" };

  return {
    ok: true,
    runId: run.id,
    chapterId: run.chapter_id,
    questId: run.quest_id,
    questSlug: quest.slug,
    displayName: quest.display_name,
    status: run.status,
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    steps: stepsRows.map(mapStepRow),
    currentStepOrderIndex: run.current_step_order_index,
    currentTaskOrderIndex: run.current_task_order_index,
  };
}
