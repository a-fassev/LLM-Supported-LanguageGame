import { parseClozeClientContent } from "@/lib/game/schemas/clozeTextContentSchema";
import { sanitizeTaskPayloadForClient } from "@/lib/game/content/sanitize-task-payload-for-client";
import {
  CLOZE_CONTENT_MISMATCH_MESSAGE,
  type NormalizedClozeContent,
} from "@/lib/game/tasks/cloze/cloze-types";
import { countClozeGaps } from "@/lib/game/tasks/cloze/cloze-gap-order";

export { CLOZE_CONTENT_MISMATCH_MESSAGE };

export type NormalizeClozeResult =
  | { ok: true; content: NormalizedClozeContent }
  | { ok: false; message: string };

export function normalizeClozeContentResult(taskPayload: Record<string, unknown>): NormalizeClozeResult {
  const sanitized = sanitizeTaskPayloadForClient("cloze", taskPayload);
  const parsed = parseClozeClientContent(sanitized);
  if (!parsed.ok) {
    return { ok: false, message: parsed.issues };
  }

  const gapCount = countClozeGaps(parsed.value.lines);
  if (gapCount === 0) {
    return { ok: false, message: CLOZE_CONTENT_MISMATCH_MESSAGE };
  }

  return { ok: true, content: parsed.value };
}
