import { MATCHING_INCOMPLETE_MESSAGE } from "@/lib/game/tasks/matching/matching-types";
import type { MatchingPairsDraft } from "@/lib/game/tasks/matching/matching-types";

export type ValidateMatchingDraftResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateMatchingDraft(
  leftIds: readonly string[],
  pairs: MatchingPairsDraft,
): ValidateMatchingDraftResult {
  for (const leftId of leftIds) {
    const rightId = pairs[leftId]?.trim();
    if (!rightId) {
      return { ok: false, message: MATCHING_INCOMPLETE_MESSAGE };
    }
  }
  return { ok: true };
}
