import {
  parseErrorSpottingClientContent,
  type ErrorSpottingClientTaskContent,
} from "@/lib/game/schemas/errorSpottingContentSchema";
import { sanitizeTaskPayloadForClient } from "@/lib/game/content/sanitize-task-payload-for-client";
import {
  ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE,
  type ErrorSpottingDraft,
  type NormalizedErrorSpottingContent,
} from "@/lib/game/tasks/error-spotting/error-spotting-types";

export { ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE };

export type NormalizeErrorSpottingResult =
  | { ok: true; content: NormalizedErrorSpottingContent }
  | { ok: false; message: string };

function mapParsedToNormalized(parsed: ErrorSpottingClientTaskContent): NormalizedErrorSpottingContent {
  const range = parsed.expectedErrorRange ?? { min: 1, max: 1 };
  const errorCount = range.min === range.max ? range.min : range.max;

  return {
    prompt: parsed.prompt?.trim() || undefined,
    counterCaption: parsed.counterCaption?.trim() || undefined,
    errorCount,
    expectedErrorRange: range,
    segments: parsed.segments.map((segment) => ({
      id: segment.id.trim(),
      text: segment.text,
      hint: segment.hint?.trim() || undefined,
    })),
  };
}

export function normalizeErrorSpottingContentResult(
  taskPayload: Record<string, unknown>,
): NormalizeErrorSpottingResult {
  const sanitized = sanitizeTaskPayloadForClient("error_spotting", taskPayload);
  const parsed = parseErrorSpottingClientContent(sanitized);
  if (!parsed.ok) {
    return { ok: false, message: parsed.issues };
  }

  try {
    const content = mapParsedToNormalized(parsed.value);
    if (content.segments.length === 0) {
      return { ok: false, message: "error spotting has no segments" };
    }
    return { ok: true, content };
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid error spotting content";
    return { ok: false, message };
  }
}

export function createEmptyErrorSpottingDraft(): ErrorSpottingDraft {
  return { selectedSegmentIds: [] };
}
