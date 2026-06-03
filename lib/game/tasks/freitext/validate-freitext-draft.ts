import { countWordsAnswer } from "@/lib/llm/freitextLlmContentSchema";
import {
  FREITEXT_ABSOLUTE_MAX_CHARACTERS,
  FREITEXT_ANSWER_EMPTY_MESSAGE,
  freitextAnswerTooLongMessage,
  freitextAnswerTooManyCharactersMessage,
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

  if (trimmed.length > FREITEXT_ABSOLUTE_MAX_CHARACTERS) {
    return { ok: false, message: freitextAnswerTooManyCharactersMessage() };
  }

  const words = countWordsAnswer(trimmed);
  if (content.minWords > 0 && words < content.minWords) {
    return { ok: false, message: freitextAnswerTooShortMessage(content.minWords) };
  }

  if (content.maxWords > 0 && words > content.maxWords) {
    return { ok: false, message: freitextAnswerTooLongMessage(content.maxWords) };
  }

  return { ok: true };
}
