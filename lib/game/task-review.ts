/**
 * Post-Controlla review payload — sent only on attempt responses, never in snapshots.
 */

import {
  taskAttemptSchema,
  type TaskAttempt,
} from "@/lib/game/scoring/evaluateTaskAttempt";

export type McQuestionReview = {
  questionIndex: number;
  selectedIds: string[];
  correctOptionIds: string[];
  isCorrect: boolean;
};

export type MultipleChoiceTaskReview = {
  screenType: "multiple_choice";
  questions: McQuestionReview[];
};

export type MatchingPairReview = {
  leftItemId: string;
  learnerRightItemId: string | null;
  correctRightItemId: string;
  isCorrect: boolean;
};

export type MatchingTaskReview = {
  screenType: "matching";
  pairs: MatchingPairReview[];
};

export type DragDropTargetReview = {
  targetId: string;
  learnerItemIds: string[];
  correctItemIds: string[];
  matchMode: "one" | "all";
  isCorrect: boolean;
};

export type DragDropTaskReview = {
  screenType: "drag_drop";
  targets: DragDropTargetReview[];
};

export type ErrorSpottingSegmentReview = {
  segmentId: string;
  isError: boolean;
  wasSelected: boolean;
  isFalsePositive: boolean;
  learnerCorrection: string | null;
  acceptedCorrections: string[];
  correctionCorrect: boolean | null;
};

export type ErrorSpottingTaskReview = {
  screenType: "error_spotting";
  segments: ErrorSpottingSegmentReview[];
};

export type ClozeGapReview = {
  gapIndex: number;
  typedAnswer: string;
  acceptedAnswers: string[];
  isCorrect: boolean;
};

export type ClozeTaskReview = {
  screenType: "cloze";
  gaps: ClozeGapReview[];
};

export type FreitextDimensionReview = {
  key: "taskFulfillment" | "grammar" | "vocabulary" | "register";
  label: string;
  score: number;
  feedback: string;
};

export type FreitextTaskReview = {
  screenType: "free_text";
  answerText: string;
  ratio: number;
  summaryFeedback: string;
  nextStepAdvice?: string;
  dimensions?: FreitextDimensionReview[];
};

export type TaskReviewDto =
  | MultipleChoiceTaskReview
  | MatchingTaskReview
  | DragDropTaskReview
  | ErrorSpottingTaskReview
  | ClozeTaskReview
  | FreitextTaskReview;

function normIdSet(ids: unknown): Set<string> {
  const out = new Set<string>();
  if (!Array.isArray(ids)) return out;
  for (const x of ids) {
    if (typeof x === "string" && x.length > 0) out.add(x.trim());
  }
  return out;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

function isSingleSelect(mode: string): boolean {
  return mode !== "multi" && mode !== "multiple";
}

function mcQuestions(content: Record<string, unknown>): {
  selectionMode: string;
  correct: Set<string>;
}[] {
  const qs = Array.isArray(content.questions) ? (content.questions as Record<string, unknown>[]) : null;
  if (qs && qs.length > 0) {
    return qs.map((q) => {
      const mode = typeof q.selectionMode === "string" ? q.selectionMode : "single";
      return {
        selectionMode: mode.trim().toLowerCase() || "single",
        correct: normIdSet(q.correctOptionIds),
      };
    });
  }
  const mode = typeof content.selectionMode === "string" ? content.selectionMode : "single";
  return [
    {
      selectionMode: mode.trim().toLowerCase() || "single",
      correct: normIdSet(content.correctOptionIds),
    },
  ];
}

function buildMcReview(
  content: Record<string, unknown>,
  attempt: Extract<TaskAttempt, { taskType: "MultipleChoice" }>,
): MultipleChoiceTaskReview {
  const questions = mcQuestions(content);
  const sel = attempt.multipleChoice.selections;
  const items: McQuestionReview[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const chosen = new Set((sel[i] ?? []).map((x) => x.trim()).filter((x) => x.length > 0));
    let isCorrect = false;
    if (chosen.size > 0) {
      if (isSingleSelect(q.selectionMode)) {
        isCorrect = chosen.size === 1 && setsEqual(chosen, q.correct);
      } else {
        isCorrect = setsEqual(chosen, q.correct);
      }
    }
    items.push({
      questionIndex: i,
      selectedIds: [...chosen],
      correctOptionIds: [...q.correct],
      isCorrect,
    });
  }

  return { screenType: "multiple_choice", questions: items };
}

function buildMatchingReview(
  content: Record<string, unknown>,
  attempt: Extract<TaskAttempt, { taskType: "Matching" }>,
): MatchingTaskReview {
  const pairs = Array.isArray(content.correctPairs) ? (content.correctPairs as Record<string, unknown>[]) : [];
  const expected = new Map<string, string>();
  for (const p of pairs) {
    const l = typeof p.leftItemId === "string" ? p.leftItemId.trim() : "";
    const r = typeof p.rightItemId === "string" ? p.rightItemId.trim() : "";
    if (l && r) expected.set(l, r);
  }

  const got = attempt.matching.pairs;
  const items: MatchingPairReview[] = [];
  for (const [leftItemId, correctRightItemId] of expected) {
    const learnerRight = got[leftItemId]?.trim() ?? "";
    items.push({
      leftItemId,
      learnerRightItemId: learnerRight || null,
      correctRightItemId,
      isCorrect: learnerRight.length > 0 && learnerRight === correctRightItemId,
    });
  }

  return { screenType: "matching", pairs: items };
}

function normalizeAssignmentMap(raw: Record<string, string | string[]>): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const [k, v] of Object.entries(raw)) {
    const key = k.trim();
    if (!key) continue;
    const set = new Set<string>();
    if (Array.isArray(v)) {
      for (const x of v) {
        if (typeof x === "string" && x.trim()) set.add(x.trim());
      }
    } else if (typeof v === "string" && v.trim()) {
      set.add(v.trim());
    }
    m.set(key, set);
  }
  return m;
}

function dragDropTargetMatchMode(target: Record<string, unknown>): "one" | "all" {
  const raw = typeof target.matchMode === "string" ? target.matchMode.trim().toLowerCase() : "";
  return raw === "all" ? "all" : "one";
}

function dragDropTargetMatches(
  placed: Set<string>,
  expected: Set<string>,
  mode: "one" | "all",
): boolean {
  if (expected.size === 0) return false;
  if (mode === "all") return setsEqual(placed, expected);
  if (placed.size !== 1) return false;
  const only = placed.values().next().value;
  return typeof only === "string" && expected.has(only);
}

function buildDragDropReview(
  content: Record<string, unknown>,
  attempt: Extract<TaskAttempt, { taskType: "DragDrop" }>,
): DragDropTaskReview {
  const targets = Array.isArray(content.targets) ? (content.targets as Record<string, unknown>[]) : [];
  const assignments = normalizeAssignmentMap(attempt.dragDrop.assignments);
  const items: DragDropTargetReview[] = [];

  for (const t of targets) {
    const tid = typeof t.id === "string" ? t.id.trim() : "";
    if (!tid) continue;
    const expectedList = Array.isArray(t.correctItemIds) ? (t.correctItemIds as unknown[]) : [];
    const expected = new Set<string>();
    for (const x of expectedList) {
      if (typeof x === "string" && x.trim()) expected.add(x.trim());
    }
    if (expected.size === 0) continue;
    const placed = assignments.get(tid) ?? new Set<string>();
    const matchMode = dragDropTargetMatchMode(t);
    items.push({
      targetId: tid,
      learnerItemIds: [...placed],
      correctItemIds: [...expected],
      matchMode,
      isCorrect: dragDropTargetMatches(placed, expected, matchMode),
    });
  }

  return { screenType: "drag_drop", targets: items };
}

function normalizeCorr(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function buildErrorSpottingReview(
  content: Record<string, unknown>,
  attempt: Extract<TaskAttempt, { taskType: "ErrorSpotting" }>,
): ErrorSpottingTaskReview {
  const segs = Array.isArray(content.segments) ? (content.segments as Record<string, unknown>[]) : [];
  const selected = new Set(
    attempt.errorSpotting.selectedSegmentIds.map((x) => x.trim()).filter((x) => x.length > 0),
  );

  const errorById = new Map<string, string[]>();
  for (const s of segs) {
    const isErr = s.isError === true;
    const id = typeof s.id === "string" ? s.id.trim() : "";
    if (!isErr || !id) continue;
    const acc = Array.isArray(s.acceptedCorrections) ? (s.acceptedCorrections as unknown[]) : [];
    const answers = acc
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
    if (answers.length > 0) errorById.set(id, answers);
  }

  const items: ErrorSpottingSegmentReview[] = [];
  for (const s of segs) {
    const id = typeof s.id === "string" ? s.id.trim() : "";
    if (!id) continue;
    const isError = s.isError === true;
    const wasSelected = selected.has(id);
    const learnerCorrection = wasSelected
      ? (attempt.errorSpotting.corrections[id] ?? "").trim() || null
      : null;

    let correctionCorrect: boolean | null = null;
    if (isError && wasSelected && learnerCorrection) {
      const accepted = errorById.get(id) ?? [];
      correctionCorrect = accepted.some(
        (a) => normalizeCorr(learnerCorrection).toLowerCase() === normalizeCorr(a).toLowerCase(),
      );
    } else if (isError && wasSelected && !learnerCorrection) {
      correctionCorrect = false;
    }

    items.push({
      segmentId: id,
      isError,
      wasSelected,
      isFalsePositive: wasSelected && !isError,
      learnerCorrection,
      acceptedCorrections: errorById.get(id) ?? [],
      correctionCorrect,
    });
  }

  return { screenType: "error_spotting", segments: items };
}

function gapInsensitive(rootInsensitive: boolean, seg: Record<string, unknown>): boolean {
  const ic = seg.ignoreCase;
  if (typeof ic === "boolean") return ic;
  if (typeof ic === "string") {
    const t = ic.trim().toLowerCase();
    if (t === "true") return true;
    if (t === "false") return false;
  }
  return rootInsensitive;
}

function clozeGapSpecs(content: Record<string, unknown>): { insensitive: boolean; answers: string[] }[] {
  const lines = Array.isArray(content.lines) ? (content.lines as Record<string, unknown>[]) : [];
  const rootIns = content.caseSensitive === true ? false : true;
  const specs: { insensitive: boolean; answers: string[] }[] = [];
  for (const line of lines) {
    const segs = Array.isArray(line.segments) ? (line.segments as Record<string, unknown>[]) : [];
    for (const seg of segs) {
      const kind = typeof seg.kind === "string" ? seg.kind.trim().toLowerCase() : "";
      if (kind !== "gap") continue;
      const answersRaw = Array.isArray(seg.correctAnswers) ? (seg.correctAnswers as unknown[]) : [];
      const answers = answersRaw
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .map((x) => x.trim());
      if (answers.length === 0) continue;
      specs.push({ insensitive: gapInsensitive(rootIns, seg), answers });
    }
  }
  return specs;
}

function matchesAnswer(typed: string, answers: string[], insensitive: boolean): boolean {
  const t = typed.trim();
  for (const a of answers) {
    if (insensitive) {
      if (t.toLowerCase() === a.trim().toLowerCase()) return true;
    } else if (t === a.trim()) return true;
  }
  return false;
}

function buildClozeReview(
  content: Record<string, unknown>,
  attempt: Extract<TaskAttempt, { taskType: "ClozeText" }>,
): ClozeTaskReview {
  const specs = clozeGapSpecs(content);
  const answers = attempt.clozeText.answers;
  const gaps: ClozeGapReview[] = [];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const typed = typeof answers[i] === "string" ? answers[i] : "";
    gaps.push({
      gapIndex: i,
      typedAnswer: typed,
      acceptedAnswers: spec.answers,
      isCorrect: matchesAnswer(typed, spec.answers, spec.insensitive),
    });
  }

  return { screenType: "cloze", gaps };
}

export type FreitextReviewInput = {
  ratio: number;
  answerText: string;
  summaryFeedback: string;
  nextStepAdvice?: string;
  dimensions?: FreitextDimensionReview[];
};

const taskTypeMap: Record<string, string | undefined> = {
  cloze: "ClozeText",
  multiple_choice: "MultipleChoice",
  drag_drop: "DragDrop",
  matching: "Matching",
  error_spotting: "ErrorSpotting",
};

export function buildTaskReview(params: {
  screenType: string;
  taskContent: Record<string, unknown>;
  attemptPayload: unknown;
  freitext?: FreitextReviewInput;
}): TaskReviewDto | null {
  const { screenType, taskContent, attemptPayload } = params;

  if (screenType === "free_text") {
    if (!params.freetext) return null;
    const input = params.freetext;
    return {
      screenType: "free_text",
      answerText: input.answerText,
      ratio: input.ratio,
      summaryFeedback: input.summaryFeedback,
      nextStepAdvice: input.nextStepAdvice,
      dimensions: input.dimensions,
    };
  }

  if (!(screenType in taskTypeMap)) return null;

  const parsed = taskAttemptSchema.safeParse(attemptPayload);
  if (!parsed.success) return null;

  const attempt = parsed.data;
  switch (attempt.taskType) {
    case "MultipleChoice":
      return buildMcReview(taskContent, attempt);
    case "Matching":
      return buildMatchingReview(taskContent, attempt);
    case "DragDrop":
      return buildDragDropReview(taskContent, attempt);
    case "ErrorSpotting":
      return buildErrorSpottingReview(taskContent, attempt);
    case "ClozeText":
      return buildClozeReview(taskContent, attempt);
    default:
      return null;
  }
}

export function readTaskReviewFromDetails(
  details: Record<string, unknown> | undefined,
): TaskReviewDto | null {
  const raw = details?.taskReview;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const screenType = (raw as { screenType?: unknown }).screenType;
  if (typeof screenType !== "string") return null;
  return raw as TaskReviewDto;
}
