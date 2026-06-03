import { ERROR_SPOTTING_EMPTY_CORRECTION_MESSAGE } from "@/lib/game/tasks/error-spotting/error-spotting-types";
import type { ErrorSpottingDraft } from "@/lib/game/tasks/error-spotting/error-spotting-types";

export type ValidateErrorSpottingDraftResult = { ok: true } | { ok: false; message: string };

export function validateErrorSpottingDraft(draft: ErrorSpottingDraft): ValidateErrorSpottingDraftResult {
  for (const segmentId of draft.selectedSegmentIds) {
    const correction = draft.corrections[segmentId]?.trim() ?? "";
    if (!correction) {
      return { ok: false, message: ERROR_SPOTTING_EMPTY_CORRECTION_MESSAGE };
    }
  }
  return { ok: true };
}
