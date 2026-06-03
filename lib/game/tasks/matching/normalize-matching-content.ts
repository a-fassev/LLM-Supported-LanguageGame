import { parseMatchingClientContent, type MatchingClientTaskContent } from "@/lib/game/schemas/matchingContentSchema";
import { sanitizeTaskPayloadForClient } from "@/lib/game/content/sanitize-task-payload-for-client";
import {
  DEFAULT_MATCHING_LEFT_LABEL,
  DEFAULT_MATCHING_RIGHT_LABEL,
  MATCHING_CONTENT_MISMATCH_MESSAGE,
  type MatchingItemView,
  type NormalizedMatchingContent,
} from "@/lib/game/tasks/matching/matching-types";

export { MATCHING_CONTENT_MISMATCH_MESSAGE };

export type NormalizeMatchingResult =
  | { ok: true; content: NormalizedMatchingContent }
  | { ok: false; message: string };

function mapItem(item: { id: string; label?: string }): MatchingItemView {
  const label = item.label?.trim();
  if (!label) {
    throw new Error(`item '${item.id}' missing label`);
  }
  return { id: item.id.trim(), label };
}

function mapParsedToNormalized(parsed: MatchingClientTaskContent): NormalizedMatchingContent {
  const presentation = parsed.presentation;
  return {
    prompt: parsed.prompt?.trim() || undefined,
    leftItems: parsed.leftItems.map(mapItem),
    rightItems: parsed.rightItems.map(mapItem),
    leftLabel: presentation?.leftLabel?.trim() || DEFAULT_MATCHING_LEFT_LABEL,
    rightLabel: presentation?.rightLabel?.trim() || DEFAULT_MATCHING_RIGHT_LABEL,
    shuffleRightOrder: presentation?.shuffleRightOrder !== false,
  };
}

export function normalizeMatchingContentResult(taskPayload: Record<string, unknown>): NormalizeMatchingResult {
  const sanitized = sanitizeTaskPayloadForClient("matching", taskPayload);
  const parsed = parseMatchingClientContent(sanitized);
  if (!parsed.ok) {
    return { ok: false, message: parsed.issues };
  }

  try {
    const content = mapParsedToNormalized(parsed.value);
    if (content.leftItems.length === 0 || content.rightItems.length === 0) {
      return { ok: false, message: "matching has no items" };
    }
    return { ok: true, content };
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid matching content";
    return { ok: false, message };
  }
}

export function createEmptyMatchingPairs(leftIds: string[]): Record<string, string | null> {
  const draft: Record<string, string | null> = {};
  for (const id of leftIds) {
    draft[id] = null;
  }
  return draft;
}
