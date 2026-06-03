import type { NormalizedMcContent } from "@/lib/game/tasks/multiple-choice/mc-types";
import { MC_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/multiple-choice/normalize-mc-content";

export const MC_UNANSWERED_MESSAGE = "Rispondi a tutte le domande prima di controllare.";

export function findFirstUnansweredQuestionIndex(
  questionCount: number,
  selections: string[][],
): number | null {
  for (let i = 0; i < questionCount; i++) {
    const row = selections[i] ?? [];
    if (row.length === 0) return i;
  }
  return null;
}

export function validateMcSelectionsLength(
  content: NormalizedMcContent,
  selections: string[][],
): { ok: true } | { ok: false; message: string } {
  if (content.questions.length === 0) {
    return { ok: false, message: MC_CONTENT_MISMATCH_MESSAGE };
  }
  if (selections.length !== content.questions.length) {
    return { ok: false, message: MC_CONTENT_MISMATCH_MESSAGE };
  }
  return { ok: true };
}

export function validateMcSelections(
  content: NormalizedMcContent,
  selections: string[][],
): { ok: true } | { ok: false; firstUnansweredIndex: number; message: string } {
  const lengthCheck = validateMcSelectionsLength(content, selections);
  if (!lengthCheck.ok) {
    return { ok: false, firstUnansweredIndex: 0, message: lengthCheck.message };
  }

  const first = findFirstUnansweredQuestionIndex(content.questions.length, selections);
  if (first === null) return { ok: true };
  return { ok: false, firstUnansweredIndex: first, message: MC_UNANSWERED_MESSAGE };
}
