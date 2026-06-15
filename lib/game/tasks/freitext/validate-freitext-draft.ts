import { countWordsAnswer } from "@/lib/llm/freitextLlmContentSchema";
import {
  FREITEXT_ANSWER_EMPTY_MESSAGE,
  freitextAnswerTooShortMessage,
} from "@/lib/game/tasks/freitext/freitext-messages";
import type { NormalizedFreitextContent } from "@/lib/game/tasks/freitext/normalize-freitext-content";

export type ValidateFreitextDraftResult = { ok: true } | { ok: false; message: string };

export function validateFreitextDraft(
  content: NormalizedFreitextContent,
  answerText: string,
): ValidateFreitextDraftResult {
  const trimmed = answerText.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: FREITEXT_ANSWER_EMPTY_MESSAGE };
  }

  const words = countWordsAnswer(trimmed);
  if (content.minWords > 0 && words < content.minWords) {
    return { ok: false, message: freitextAnswerTooShortMessage(content.minWords) };
  }

  return { ok: true };
}
