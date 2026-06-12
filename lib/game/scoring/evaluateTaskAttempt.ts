import { z } from "zod";
import { scoringClientMessages as scoreMsg } from "@/lib/game/clientMessages";

const clozeAttemptSchema = z.object({
  taskType: z.literal("ClozeText"),
  clozeText: z.object({
    answers: z.array(z.string()),
  }),
});

const mcAttemptSchema = z.object({
  taskType: z.literal("MultipleChoice"),
  multipleChoice: z.object({
    selections: z.array(z.array(z.string())),
  }),
});

const dragAttemptSchema = z.object({
  taskType: z.literal("DragDrop"),
  dragDrop: z.object({
    assignments: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  }),
});

const matchingAttemptSchema = z.object({
  taskType: z.literal("Matching"),
  matching: z.object({
    pairs: z.record(z.string(), z.string()),
  }),
});

const errorSpottingAttemptSchema = z.object({
  taskType: z.literal("ErrorSpotting"),
  errorSpotting: z.object({
    selectedSegmentIds: z.array(z.string()),
    corrections: z.record(z.string(), z.string()).optional(),
  }),
});

const specialBlockAttemptSchema = z.union([
  clozeAttemptSchema,
  mcAttemptSchema,
  dragAttemptSchema,
  matchingAttemptSchema,
  errorSpottingAttemptSchema,
  z.object({ taskType: z.literal("Stub") }),
  z.object({ taskType: z.string() }).passthrough(),
]);

const specialScreenAttemptSchema = z.object({
  taskType: z.enum([
    "SpecialScreen",
    "SpecialScreenSms",
    "SpecialScreenMailEditor",
    "SpecialScreenPhotoViewer",
    "SpecialScreenReader",
  ]),
  specialScreen: z.object({
    blocks: z.array(specialBlockAttemptSchema.nullable()),
  }),
});

export const taskAttemptSchema = z.discriminatedUnion("taskType", [
  clozeAttemptSchema,
  mcAttemptSchema,
  dragAttemptSchema,
  matchingAttemptSchema,
  errorSpottingAttemptSchema,
  specialScreenAttemptSchema,
]);

export type TaskAttempt = z.infer<typeof taskAttemptSchema>;

export type TaskAttemptEvalResult =
  | {
      ok: true;
      /** Eligibility / minimum-performance ratio (0..1). */
      ratio: number;
      /** Optional: pizza mapping only; defaults to `ratio`. Used when completion should pass but pizza stays 0 (e.g. stub-only SpecialScreen). */
      pizzaRatio?: number;
      /** Discrete score parts (e.g. gaps correct / gaps total); omit when not meaningful for UX. */
      itemsCorrect?: number;
      itemsTotal?: number;
    }
  | { ok: false; status: number; error: string; code: string };

function err(status: number, error: string, code: string): TaskAttemptEvalResult {
  return { ok: false, status, error, code };
}

function gapInsensitive(rootInsensitive: boolean, seg: Record<string, unknown>): boolean {
  const ic = seg.ignoreCase;
  if (typeof ic === "boolean") {
    return ic;
  }
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

export function evaluateCloze(
  content: Record<string, unknown>,
  attempt: z.infer<typeof clozeAttemptSchema>,
): TaskAttemptEvalResult {
  const specs = clozeGapSpecs(content);
  if (specs.length === 0) return err(502, scoreMsg.clozePayloadNoGaps, "payload_invalid");
  const answers = attempt.clozeText.answers;
  if (answers.length !== specs.length) {
    return err(400, scoreMsg.clozeGapCountMismatch, "attempt_mismatch");
  }
  let correct = 0;
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const raw = answers[i] ?? "";
    if (typeof raw !== "string") return err(400, scoreMsg.invalidClozeAnswer, "attempt_invalid");
    if (matchesAnswer(raw, spec.answers, spec.insensitive)) correct++;
  }
  return { ok: true, ratio: correct / specs.length, itemsCorrect: correct, itemsTotal: specs.length };
}

function clozeAnswersAllEmpty(answers: string[]): boolean {
  return answers.every((raw) => (typeof raw === "string" ? raw : "").trim().length === 0);
}

function clozeAnswersAnyEmpty(answers: string[]): boolean {
  return answers.some((raw) => (typeof raw === "string" ? raw : "").trim().length === 0);
}

function evaluateOptionalClozeBlock(
  payload: Record<string, unknown>,
  attempt: z.infer<typeof clozeAttemptSchema>,
): TaskAttemptEvalResult | { ok: true; skipped: true } {
  const answers = attempt.clozeText.answers;
  if (clozeAnswersAllEmpty(answers)) {
    return { ok: true, skipped: true };
  }
  if (clozeAnswersAnyEmpty(answers)) {
    return err(400, scoreMsg.optionalClozeAllOrNothing, "attempt_invalid");
  }
  const scored = evaluateCloze(payload, attempt);
  if (!scored.ok) return scored;
  if (scored.ratio < 1) {
    return err(400, scoreMsg.optionalClozeIncorrect, "attempt_invalid");
  }
  return scored;
}

function normIdSet(ids: unknown): Set<string> {
  const out = new Set<string>();
  if (!Array.isArray(ids)) return out;
  for (const x of ids) {
    if (typeof x === "string" && x.length > 0) out.add(x.trim());
  }
  return out;
}

function mcQuestions(content: Record<string, unknown>): {
  selectionMode: string;
  correct: Set<string>;
}[] {
  const qs = Array.isArray(content.questions) ? (content.questions as Record<string, unknown>[]) : null;
  if (qs && qs.length > 0) {
    return qs.map((q) => {
      const mode = typeof q.selectionMode === "string" ? q.selectionMode : "single";
      const correct = normIdSet(q.correctOptionIds);
      return {
        selectionMode: mode.trim().toLowerCase() || "single",
        correct,
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

function isSingleSelect(mode: string): boolean {
  return mode !== "multi" && mode !== "multiple";
}

export function evaluateMultipleChoice(
  content: Record<string, unknown>,
  attempt: z.infer<typeof mcAttemptSchema>,
): TaskAttemptEvalResult {
  const questions = mcQuestions(content);
  const sel = attempt.multipleChoice.selections;
  if (sel.length !== questions.length) {
    return err(400, scoreMsg.mcAttemptLengthMismatch, "attempt_mismatch");
  }
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const chosen = new Set((sel[i] ?? []).map((x) => x.trim()).filter((x) => x.length > 0));
    if (chosen.size === 0) continue;
    if (isSingleSelect(q.selectionMode)) {
      if (chosen.size === 1 && setsEqual(chosen, q.correct)) correct++;
    } else if (setsEqual(chosen, q.correct)) {
      correct++;
    }
  }
  return { ok: true, ratio: correct / questions.length, itemsCorrect: correct, itemsTotal: questions.length };
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
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

export function evaluateDragDrop(
  content: Record<string, unknown>,
  attempt: z.infer<typeof dragAttemptSchema>,
): TaskAttemptEvalResult {
  const pres = (content.presentation ?? {}) as Record<string, unknown>;
  const presentationMode =
    typeof pres.targetMode === "string" ? pres.targetMode.trim().toLowerCase() : "";
  if (presentationMode === "lines") {
    return err(501, scoreMsg.dragDropLinesNotImplemented, "unsupported_dragdrop_mode");
  }
  const targets = Array.isArray(content.targets) ? (content.targets as Record<string, unknown>[]) : [];
  if (targets.length === 0) return err(502, scoreMsg.dragDropNoTargets, "payload_invalid");

  const assignments = normalizeAssignmentMap(attempt.dragDrop.assignments);
  let correct = 0;
  for (const t of targets) {
    const tid = typeof t.id === "string" ? t.id.trim() : "";
    if (!tid) continue;
    const expectedList = Array.isArray(t.correctItemIds) ? (t.correctItemIds as unknown[]) : [];
    const expected = new Set<string>();
    for (const x of expectedList) {
      if (typeof x === "string" && x.trim()) expected.add(x.trim());
    }
    const placed = assignments.get(tid) ?? new Set<string>();
    if (expected.size === 0) continue;
    const targetMatchMode = dragDropTargetMatchMode(t);
    if (dragDropTargetMatches(placed, expected, targetMatchMode)) correct++;
  }
  const denom = targets.filter((t) => {
    const ids = Array.isArray(t.correctItemIds) ? t.correctItemIds : [];
    return ids.length > 0;
  }).length;
  if (denom === 0) return err(502, scoreMsg.dragDropMissingCorrectIds, "payload_invalid");
  return { ok: true, ratio: correct / denom, itemsCorrect: correct, itemsTotal: denom };
}

export function evaluateMatching(
  content: Record<string, unknown>,
  attempt: z.infer<typeof matchingAttemptSchema>,
): TaskAttemptEvalResult {
  const pairs = Array.isArray(content.correctPairs) ? (content.correctPairs as Record<string, unknown>[]) : [];
  const expected = new Map<string, string>();
  for (const p of pairs) {
    const l = typeof p.leftItemId === "string" ? p.leftItemId.trim() : "";
    const r = typeof p.rightItemId === "string" ? p.rightItemId.trim() : "";
    if (l && r) expected.set(l, r);
  }
  if (expected.size === 0) return err(502, scoreMsg.matchingNoPairs, "payload_invalid");
  const got = attempt.matching.pairs;
  let correct = 0;
  for (const [l, r] of expected) {
    const gr = got[l]?.trim() ?? "";
    if (gr && gr === r) correct++;
  }
  return { ok: true, ratio: correct / expected.size, itemsCorrect: correct, itemsTotal: expected.size };
}

function errorSegmentIds(content: Record<string, unknown>): string[] {
  const segs = Array.isArray(content.segments) ? (content.segments as Record<string, unknown>[]) : [];
  const out: string[] = [];
  for (const s of segs) {
    const isErr = s.isError === true;
    const id = typeof s.id === "string" ? s.id.trim() : "";
    if (!isErr || !id) continue;
    const acc = Array.isArray(s.acceptedCorrections) ? (s.acceptedCorrections as unknown[]) : [];
    const answers = acc.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
    if (answers.length > 0) out.push(id);
  }
  return out;
}

export function evaluateErrorSpotting(
  content: Record<string, unknown>,
  attempt: z.infer<typeof errorSpottingAttemptSchema>,
): TaskAttemptEvalResult {
  const errors = errorSegmentIds(content);
  if (errors.length === 0) return err(502, scoreMsg.errorSpottingNoErrors, "payload_invalid");

  const selected = new Set(
    attempt.errorSpotting.selectedSegmentIds.map((x) => x.trim()).filter((x) => x.length > 0),
  );

  let found = 0;
  for (const id of errors) {
    if (selected.has(id)) found++;
  }

  return { ok: true, ratio: found / errors.length, itemsCorrect: found, itemsTotal: errors.length };
}

function mapSpecialBlockType(raw: string | undefined): string {
  const t = (raw ?? "").trim().toLowerCase();
  if (t === "cloze_text" || t === "clozetext") return "ClozeText";
  if (t === "error_spotting" || t === "errorspotting") return "ErrorSpotting";
  if (t === "stub") return "Stub";
  return "Unknown";
}

export function evaluateSpecialScreen(
  content: Record<string, unknown>,
  attempt: z.infer<typeof specialScreenAttemptSchema>,
): TaskAttemptEvalResult {
  const blocks = Array.isArray(content.blocks) ? (content.blocks as Record<string, unknown>[]) : [];
  const attempts = attempt.specialScreen.blocks;
  if (attempts.length !== blocks.length) {
    return err(400, scoreMsg.specialScreenBlockLengthMismatch, "attempt_mismatch");
  }

  let weighted = 0;
  let weight = 0;
  let itemsCorrectSum = 0;
  let itemsTotalSum = 0;
  let optionalClozeBlocks = 0;
  let optionalClozeCompleted = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const att = attempts[i];
    const rawBlockType = typeof block.blockType === "string" ? block.blockType : "";
    const bt = mapSpecialBlockType(rawBlockType);

    if (bt === "Stub") continue;

    if (bt === "Unknown") {
      return err(
        502,
        scoreMsg.specialScreenUnsupportedBlockType(i + 1, rawBlockType.trim() || "(mancante)"),
        "unsupported_special_screen_block",
      );
    }

    if (att == null) {
      return err(400, scoreMsg.specialScreenBlockMissingAttempt(i + 1), "attempt_mismatch");
    }

    const payload =
      bt === "ClozeText"
        ? (block.clozeText as Record<string, unknown> | undefined)
        : (block.errorSpotting as Record<string, unknown> | undefined);
    if (!payload || typeof payload !== "object") {
      return err(
        502,
        scoreMsg.specialScreenBlockMissingContent(i + 1, bt),
        "payload_invalid",
      );
    }

    let inner: TaskAttemptEvalResult | { ok: true; skipped: true };
    if (bt === "ClozeText" && att.taskType === "ClozeText") {
      const isOptional = payload.optional === true;
      if (isOptional) {
        optionalClozeBlocks += 1;
        inner = evaluateOptionalClozeBlock(payload, att as z.infer<typeof clozeAttemptSchema>);
        if ("skipped" in inner && inner.skipped) {
          continue;
        }
        optionalClozeCompleted += 1;
      } else {
        inner = evaluateCloze(payload, att as z.infer<typeof clozeAttemptSchema>);
      }
    } else if (bt === "ErrorSpotting" && att.taskType === "ErrorSpotting") {
      inner = evaluateErrorSpotting(payload, att as z.infer<typeof errorSpottingAttemptSchema>);
    } else {
      return err(400, scoreMsg.specialScreenBlockTypeMismatch(i + 1), "attempt_mismatch");
    }
    if (!inner.ok) return inner;
    if ("skipped" in inner) continue;
    weight += 1;
    weighted += inner.ratio;
    if ("itemsTotal" in inner && inner.itemsTotal != null && inner.itemsTotal > 0) {
      itemsCorrectSum += Math.max(0, inner.itemsCorrect ?? 0);
      itemsTotalSum += inner.itemsTotal;
    }
  }

  if (optionalClozeBlocks > 0 && optionalClozeCompleted === 0) {
    return err(400, scoreMsg.specialScreenCompleteOneIdentikit, "attempt_invalid");
  }

  // No scorable blocks: full completion credit, no pizza (avoid minting slices on empty screens).
  if (weight === 0) return { ok: true, ratio: 1, pizzaRatio: 0 };
  const base: TaskAttemptEvalResult = { ok: true, ratio: weighted / weight };
  if (itemsTotalSum > 0) {
    return {
      ...base,
      itemsCorrect: itemsCorrectSum,
      itemsTotal: itemsTotalSum,
    };
  }
  return base;
}

export function evaluateTaskAttempt(
  taskType: string,
  contentPayload: Record<string, unknown>,
  attemptRaw: unknown,
): TaskAttemptEvalResult {
  const parsed = taskAttemptSchema.safeParse(attemptRaw);
  if (!parsed.success) {
    return err(400, scoreMsg.invalidTaskAttemptPayload, "attempt_invalid");
  }
  const attempt = parsed.data;
  if (attempt.taskType !== taskType) {
    return err(400, scoreMsg.attemptTaskTypeMismatch, "attempt_task_mismatch");
  }

  switch (attempt.taskType) {
    case "ClozeText":
      return evaluateCloze(contentPayload, attempt);
    case "MultipleChoice":
      return evaluateMultipleChoice(contentPayload, attempt);
    case "DragDrop":
      return evaluateDragDrop(contentPayload, attempt);
    case "Matching":
      return evaluateMatching(contentPayload, attempt);
    case "ErrorSpotting":
      return evaluateErrorSpotting(contentPayload, attempt);
    case "SpecialScreen":
    case "SpecialScreenSms":
    case "SpecialScreenMailEditor":
    case "SpecialScreenPhotoViewer":
    case "SpecialScreenReader":
      return evaluateSpecialScreen(contentPayload, attempt);
    default:
      return err(400, scoreMsg.unsupportedTaskType, "unsupported_task");
  }
}
