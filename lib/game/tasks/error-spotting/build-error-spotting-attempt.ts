import type { ErrorSpottingDraft } from "@/lib/game/tasks/error-spotting/error-spotting-types";

export type ErrorSpottingAttemptPayload = {
  taskType: "ErrorSpotting";
  errorSpotting: {
    selectedSegmentIds: string[];
  };
};

export function buildErrorSpottingAttempt(draft: ErrorSpottingDraft): ErrorSpottingAttemptPayload {
  const selectedSegmentIds = [
    ...new Set(
      draft.selectedSegmentIds
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    ),
  ];

  return {
    taskType: "ErrorSpotting",
    errorSpotting: {
      selectedSegmentIds,
    },
  };
}
