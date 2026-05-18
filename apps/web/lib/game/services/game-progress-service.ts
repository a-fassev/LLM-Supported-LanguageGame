import {
  abandonAllInProgressRunsForAccount,
  bucketQuestsByChapterId,
  bucketStepsByQuestId,
  deleteFreitextLlmEvaluationGate,
  validateFreitextLlmEvaluationGate,
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
  upsertFreitextLlmEvaluationGate,
  type GameQuestRow,
  type GameQuestStepRow,
  type PlayerQuestRunRow,
} from "@/lib/game/repositories/game-progress-repository";
import { parseCutsceneContent } from "@/lib/game/schemas/cutsceneContentSchema";
import { countWordsAnswer, parseFreitextLlmStepContent } from "@/lib/llm/freitextLlmContentSchema";
import { resolveFreitextLlmEvaluatorEnv } from "@/lib/llm/freitextLlmEnv";
import {
  calculateScore as calculateStructuredTaskScore,
  invokeFreitextLlmJudge,
  mapFreitextLlmProviderError,
  normalizeFeedbackForLearner,
  weightedSkillRatio,
} from "@/lib/llm/freitextLlmEvaluationService";

/** Must match Unity `ToolkitStepFactory` + `game_quest_steps.task_type` authoring. */
export const FREITEXT_LLM_TASK_TYPE = "FreitextLlm" as const;

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
  | { ok: false; status: number; error: string; code?: string; details?: Record<string, unknown> };

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
  | { ok: false; status: number; error: string; code?: string; details?: Record<string, unknown> };

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
  | { ok: false; status: number; error: string; code?: string; details?: Record<string, unknown> };

export type CutscenePayloadErrorDetail = {
  questSlug: string;
  questId: string;
  stepId: string;
  templateKey: string;
  issues: string;
};

function buildQuestStepDto(row: GameQuestStepRow): GameQuestStepDto {
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

type MapQuestStepsResult =
  | { ok: true; steps: GameQuestStepDto[] }
  | {
      ok: false;
      status: 502;
      error: string;
      code: "payload_invalid";
      details: CutscenePayloadErrorDetail;
    };

function collectCutscenePayloadErrors(
  questRows: GameQuestRow[],
  stepsByQuest: Map<string, GameQuestStepRow[]>,
): CutscenePayloadErrorDetail[] {
  const out: CutscenePayloadErrorDetail[] = [];
  for (const quest of questRows) {
    const stepRows = stepsByQuest.get(quest.id) ?? [];
    for (const row of stepRows) {
      if (row.step_kind !== "cutscene") continue;
      const parsed = parseCutsceneContent(row.content_payload);
      if (!parsed.ok) {
        out.push({
          questSlug: quest.slug,
          questId: quest.id,
          stepId: row.id,
          templateKey: row.template_key ?? "",
          issues: parsed.issues,
        });
      }
    }
  }
  return out;
}

function mapQuestStepRowsWithCutsceneValidation(
  rows: GameQuestStepRow[],
  questRef: { id: string; slug: string },
): MapQuestStepsResult {
  for (const row of rows) {
    if (row.step_kind !== "cutscene") continue;
    const parsed = parseCutsceneContent(row.content_payload);
    if (!parsed.ok) {
      const detail: CutscenePayloadErrorDetail = {
        questSlug: questRef.slug,
        questId: questRef.id,
        stepId: row.id,
        templateKey: row.template_key ?? "",
        issues: parsed.issues,
      };
      console.error("[game-progress] Malformed Cutscene content payload", detail);
      return {
        ok: false,
        status: 502,
        error: "Malformed Cutscene content payload",
        code: "payload_invalid",
        details: detail,
      };
    }
  }
  return { ok: true, steps: rows.map(buildQuestStepDto) };
}

function pickExpectedPendingStep(run: PlayerQuestRunRow, steps: GameQuestStepRow[]): GameQuestStepRow | null {
  const ordered = [...steps].sort((a, b) => a.order_index - b.order_index);
  const idx = run.current_step_order_index;
  if (idx < 0 || idx >= ordered.length) return null;
  return ordered[idx] ?? null;
}

export type EvaluateFreitextLlmResult =
  | {
      ok: true;
      isPass: boolean;
      weightedScore: number;
      grammarScore: number;
      vocabularyScore: number;
      registerScore: number;
      grammarFeedback: string;
      vocabularyFeedback: string;
      registerFeedback: string;
      summaryFeedback: string;
      nextStepAdvice: string;
      scoreEarned: number;
      scoreMax: number;
      evaluationGateToken?: string;
    }
  | { ok: false; status: number; error: string; code?: string; retryable?: boolean };

export async function evaluateFreitextLlmQuestStep(
  accountId: string,
  runId: string,
  stepId: string,
  answerText: string,
): Promise<EvaluateFreitextLlmResult> {
  const trimmed = typeof answerText === "string" ? answerText.trim() : "";

  const run = await getQuestRunById(runId);
  if (!run || run.account_id !== accountId) {
    return { ok: false, status: 404, error: "Run not found", code: "run_not_found", retryable: false };
  }
  if (run.status !== "in_progress") {
    return { ok: false, status: 400, error: "Run is not active", code: "run_not_active", retryable: false };
  }

  const stepsRows = await listStepsForQuest(run.quest_id);
  if (!stepsRows) {
    return { ok: false, status: 500, error: "Could not load quest steps", code: "steps_load_failed", retryable: true };
  }

  const expected = pickExpectedPendingStep(run, stepsRows);
  if (!expected || expected.id !== stepId) {
    return { ok: false, status: 409, error: "Step mismatch", code: "step_mismatch", retryable: false };
  }
  if (expected.step_kind !== "task" || expected.task_type !== FREITEXT_LLM_TASK_TYPE) {
    return { ok: false, status: 400, error: "Wrong task type", code: "wrong_task_type", retryable: false };
  }

  if (trimmed.length === 0) {
    return { ok: false, status: 400, error: "Answer is empty", code: "answer_empty", retryable: false };
  }

  const payload = parseFreitextLlmStepContent(expected.content_payload);
  if (!payload.ok) {
    return {
      ok: false,
      status: 502,
      error: "Malformed FreitextLlm content payload",
      code: "payload_invalid",
      retryable: false,
    };
  }

  const minW = payload.value.minWords ?? 0;
  const maxW = payload.value.maxWords ?? 0;
  const words = countWordsAnswer(trimmed);

  if (minW > 0 && words < minW) {
    return {
      ok: false,
      status: 400,
      error: `Answer must have at least ${minW} word(s).`,
      code: "answer_too_short",
      retryable: false,
    };
  }

  if (maxW > 0 && words > maxW) {
    return {
      ok: false,
      status: 400,
      error: `Answer must stay within ${maxW} words.`,
      code: "answer_too_long",
      retryable: false,
    };
  }

  const env = resolveFreitextLlmEvaluatorEnv();
  if (!env) {
    return {
      ok: false,
      status: 503,
      error: "LLM evaluation is not configured on the server.",
      code: "evaluator_unavailable",
      retryable: false,
    };
  }

  const controller = new AbortController();
  const timer =
    env.llmTimeoutMs > 0
      ? setTimeout(() => controller.abort(), Math.max(1000, env.llmTimeoutMs))
      : null;

  try {
    const modelOut = await invokeFreitextLlmJudge(payload.value, trimmed, env, controller.signal);
    const ratio = weightedSkillRatio(
      payload.value.evaluation,
      modelOut.grammarScore,
      modelOut.vocabularyScore,
      modelOut.registerScore,
    );

    const isPass = ratio >= payload.value.evaluation.passThreshold;

    const scoreEarned = calculateStructuredTaskScore(
      payload.value.evaluation.scoringPolicy,
      ratio,
      payload.value.evaluation.maxPoints,
      payload.value.evaluation.passThreshold,
    );

    let evaluationGateToken: string | undefined;
    if (isPass) {
      const gate = await upsertFreitextLlmEvaluationGate(accountId, runId, stepId, env.gateTtlMinutes);
      if (!gate) {
        return {
          ok: false,
          status: 503,
          error: "Could not issue evaluation gate.",
          code: "gate_issue_failed",
          retryable: true,
        };
      }
      evaluationGateToken = gate.token;
    }

    return {
      ok: true,
      isPass,
      weightedScore: ratio,
      grammarScore: modelOut.grammarScore,
      vocabularyScore: modelOut.vocabularyScore,
      registerScore: modelOut.registerScore,
      grammarFeedback: normalizeFeedbackForLearner(modelOut.grammarFeedback, 380),
      vocabularyFeedback: normalizeFeedbackForLearner(modelOut.vocabularyFeedback, 380),
      registerFeedback: normalizeFeedbackForLearner(modelOut.registerFeedback, 380),
      summaryFeedback: normalizeFeedbackForLearner(modelOut.summaryFeedback, 520),
      nextStepAdvice: normalizeFeedbackForLearner(modelOut.nextStepAdvice, 260),
      scoreEarned,
      scoreMax: payload.value.evaluation.maxPoints,
      evaluationGateToken,
    };
  } catch (err) {
    const abortedBySignal = controller.signal.aborted;
    const abortByName =
      (err instanceof Error && err.name === "AbortError") ||
      (typeof err === "object" &&
        err !== null &&
        "name" in err &&
        typeof (err as { name?: unknown }).name === "string" &&
        (err as { name: string }).name === "AbortError");

    if (abortedBySignal || abortByName) {
      return {
        ok: false,
        status: 504,
        error: "Model timed out while scoring this answer.",
        code: "MODEL_TIMEOUT",
        retryable: true,
      };
    }

    const mapped = mapFreitextLlmProviderError(err);
    if (mapped) {
      return {
        ok: false,
        status: mapped.status,
        error: mapped.message,
        code: mapped.code,
        retryable: mapped.retryable,
      };
    }

    console.error("[game-progress] evaluateFreitextLlmQuestStep", err);
    return {
      ok: false,
      status: 503,
      error: "FreitextLlm evaluator error.",
      code: "EVALUATOR_ERROR",
      retryable: true,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
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

  const cutscenePayloadErrors = collectCutscenePayloadErrors(quests, stepsByQuest);
  if (cutscenePayloadErrors.length > 0) {
    console.error("[game-progress] Malformed Cutscene content payload(s)", cutscenePayloadErrors);
    return {
      ok: false,
      status: 502,
      error: "Malformed Cutscene content payload",
      code: "payload_invalid",
      details: { cutscenePayloadErrors },
    };
  }

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

    const questDtos: GameQuestClientDto[] = [];
    for (const quest of chapterQuestsSorted) {
      const stepRows = stepsByQuest.get(quest.id) ?? [];
      const stepsSnapshot = stepRows.map(buildQuestStepDto);

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

      questDtos.push({
        id: quest.id,
        chapterId: chapter.id,
        slug: quest.slug,
        displayName: quest.display_name,
        orderIndex: quest.order_index,
        isUnlocked: unlocked,
        hasCompletedAnyRun: completedQuestSet.has(quest.id),
        unlockHint,
        steps: stepsSnapshot,
      });
    }

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

  const mappedSteps = mapQuestStepRowsWithCutsceneValidation(stepRows, { id: quest.id, slug: quest.slug });
  if (!mappedSteps.ok) {
    return {
      ok: false,
      status: mappedSteps.status,
      error: mappedSteps.error,
      code: mappedSteps.code,
      details: mappedSteps.details,
    };
  }

  return {
    ok: true,
    runId: run.id,
    chapterId: quest.chapter_id,
    questId: quest.id,
    questSlug: quest.slug,
    displayName: quest.display_name,
    totalSlices: wallet.totalSlices,
    totalBackpackPieces: wallet.totalBackpackPieces,
    steps: mappedSteps.steps,
    currentStepOrderIndex: run.current_step_order_index,
    currentTaskOrderIndex: run.current_task_order_index,
  };
}

export async function completeQuestStepTask(
  accountId: string,
  runId: string,
  stepId: string,
  options?: { evaluationGateToken?: string | null },
): Promise<CompleteStepTaskResult> {
  const run = await getQuestRunById(runId);
  if (!run || run.account_id !== accountId) {
    return { ok: false, status: 404, error: "Run not found", code: "run_not_found" };
  }

  const stepsRows = await listStepsForQuest(run.quest_id);
  if (!stepsRows) return { ok: false, status: 500, error: "Could not load quest steps", code: "steps_load_failed" };

  const expected = pickExpectedPendingStep(run, stepsRows);
  if (!expected || expected.id !== stepId) {
    return { ok: false, status: 409, error: "Step mismatch", code: "step_mismatch" };
  }

  if (expected.step_kind === "task" && expected.task_type === FREITEXT_LLM_TASK_TYPE) {
    const token = typeof options?.evaluationGateToken === "string" ? options.evaluationGateToken.trim() : "";
    if (!token) {
      return {
        ok: false,
        status: 403,
        error: "Completing FreitextLlm requires passing server evaluation.",
        code: "evaluation_gate_required",
      };
    }

    const gateOk = await validateFreitextLlmEvaluationGate(accountId, runId, stepId, token);
    if (!gateOk) {
      return {
        ok: false,
        status: 403,
        error: "Stale or invalid evaluation token. Submit Check again to re-score your answer.",
        code: "evaluation_gate_invalid",
      };
    }
  }

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

  if (expected.step_kind === "task" && expected.task_type === FREITEXT_LLM_TASK_TYPE) {
    const token = typeof options?.evaluationGateToken === "string" ? options.evaluationGateToken.trim() : "";
    if (token.length > 0) {
      await deleteFreitextLlmEvaluationGate(accountId, token);
    }
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

  const mappedSteps = mapQuestStepRowsWithCutsceneValidation(stepsRows, { id: quest.id, slug: quest.slug });
  if (!mappedSteps.ok) {
    return {
      ok: false,
      status: mappedSteps.status,
      error: mappedSteps.error,
      code: mappedSteps.code,
      details: mappedSteps.details,
    };
  }

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
    steps: mappedSteps.steps,
    currentStepOrderIndex: run.current_step_order_index,
    currentTaskOrderIndex: run.current_task_order_index,
  };
}
