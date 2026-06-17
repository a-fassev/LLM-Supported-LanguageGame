import {
  FREITEXT_ANSWER_EMPTY_MESSAGE,
  FREITEXT_ANSWER_TEMPLATE_STRUCTURE_MESSAGE,
  FREITEXT_ANSWER_UNCHANGED_TEMPLATE_MESSAGE,
  freitextAnswerTooShortMessage,
} from "@/lib/game/tasks/freitext/freitext-messages";
import {
  countFreitextAnswerWordsBeyondTemplate,
  isFreitextAnswerMissingTemplateStructure,
  isFreitextAnswerUnchangedTemplate,
} from "@/lib/game/tasks/freitext/freitext-initial-answer";
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

  if (isFreitextAnswerUnchangedTemplate(trimmed, content.initialAnswerText)) {
    return { ok: false, message: FREITEXT_ANSWER_UNCHANGED_TEMPLATE_MESSAGE };
  }

  if (isFreitextAnswerMissingTemplateStructure(trimmed, content.initialAnswerText)) {
    return { ok: false, message: FREITEXT_ANSWER_TEMPLATE_STRUCTURE_MESSAGE };
  }

  const wordsBeyondTemplate = countFreitextAnswerWordsBeyondTemplate(
    trimmed,
    content.initialAnswerText,
  );
  if (content.minWords > 0 && wordsBeyondTemplate < content.minWords) {
    return { ok: false, message: freitextAnswerTooShortMessage(content.minWords) };
  }

  return { ok: true };
}
