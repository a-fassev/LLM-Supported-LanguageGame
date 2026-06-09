/** Shared Tailwind classes for in-task solution review highlighting. */

/** ring-inset: outer rings are clipped by TaskChrome / TaskBodyLayout overflow scroll. */
export const TASK_REVIEW_CORRECT =
  "border-emerald-600 bg-emerald-500/15 ring-1 ring-inset ring-emerald-600/40";

export const TASK_REVIEW_INCORRECT =
  "border-destructive bg-destructive/10 ring-1 ring-inset ring-destructive/40";

export const TASK_REVIEW_MISSED =
  "border-amber-600 bg-amber-500/10 ring-1 ring-inset ring-amber-600/40";

export const TASK_REVIEW_NEUTRAL = "border-border bg-background/80";

export const TASK_REVIEW_HINT_TEXT = "text-sm text-muted-foreground";

export function mcOptionReviewClass(params: {
  optionId: string;
  selectedIds: string[];
  correctOptionIds: string[];
}): string {
  const { optionId, selectedIds, correctOptionIds } = params;
  const selected = selectedIds.includes(optionId);
  const correct = correctOptionIds.includes(optionId);
  if (selected && correct) return TASK_REVIEW_CORRECT;
  if (selected && !correct) return TASK_REVIEW_INCORRECT;
  if (!selected && correct) return TASK_REVIEW_MISSED;
  return TASK_REVIEW_NEUTRAL;
}
