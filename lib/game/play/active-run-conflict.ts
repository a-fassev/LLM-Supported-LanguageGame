import type { ApiErrorResult } from "@/lib/api-client";
import { readNonEmptyString } from "@/lib/game/read-non-empty-string";

export type ActiveRunConflict = {
  chapterId: string;
  questId: string;
};

export function readActiveRunConflict(error: ApiErrorResult): ActiveRunConflict | null {
  const chapterId = readNonEmptyString(error.details?.existingChapterId);
  const questId = readNonEmptyString(error.details?.existingQuestId);
  if (!chapterId || !questId) return null;
  return { chapterId, questId };
}

export function buildActiveRunResumePath(conflict: ActiveRunConflict): string {
  return `/play?chapterId=${encodeURIComponent(conflict.chapterId)}&questId=${encodeURIComponent(conflict.questId)}`;
}

/** Empty-state panel when another quest is still in progress (not the loading spinner). */
export function shouldShowActiveRunConflictPanel(params: {
  loading: boolean;
  hasRun: boolean;
  conflict: ActiveRunConflict | null;
}): params is { loading: false; hasRun: false; conflict: ActiveRunConflict } {
  return !params.loading && !params.hasRun && params.conflict !== null;
}

/** Empty-state panel when start/snapshot failed without an active-run conflict. */
export function shouldShowPlayLoadErrorPanel(params: {
  loading: boolean;
  hasRun: boolean;
  conflict: ActiveRunConflict | null;
  error: string | null;
}): boolean {
  return (
    !params.loading &&
    !params.hasRun &&
    params.conflict === null &&
    params.error !== null &&
    params.error.length > 0
  );
}

export function buildPlayLoadErrorBackPath(chapterId: string | null): string {
  return chapterId ? `/chapters/${chapterId}` : "/chapters";
}
