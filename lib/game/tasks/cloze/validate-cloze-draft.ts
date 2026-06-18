import {
  CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE,
  CLOZE_INCOMPLETE_MESSAGE,
} from "@/lib/game/tasks/cloze/cloze-types";

export type ValidateClozeDraftResult = { ok: true } | { ok: false; message: string };

export function validateClozeDraft(
  answers: readonly string[],
  expectedGapCount: number,
  optionalGapIndexes: ReadonlySet<number> = new Set<number>(),
): ValidateClozeDraftResult {
  if (expectedGapCount < 1) {
    return { ok: false, message: CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE };
  }
  if (answers.length !== expectedGapCount) {
    return { ok: false, message: CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE };
  }
  for (const [index, raw] of answers.entries()) {
    if (optionalGapIndexes.has(index)) continue;
    if ((typeof raw === "string" ? raw : "").trim().length === 0) {
      return { ok: false, message: CLOZE_INCOMPLETE_MESSAGE };
    }
  }
  return { ok: true };
}
