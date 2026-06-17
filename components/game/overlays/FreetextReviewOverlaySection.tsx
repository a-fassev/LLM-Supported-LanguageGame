"use client";

import type { FreitextTaskReview } from "@/lib/api-client";
import { TASK_PLAY_BODY_TEXT, TASK_PLAY_META_TEXT } from "@/lib/game/task-typography";

type FreetextReviewOverlaySectionProps = {
  review: FreitextTaskReview;
  /** When false, summary/advice are omitted (e.g. already in overlay body). */
  showSummary?: boolean;
  /** Per-dimension scores shown on success overlay. */
  showDimensions?: boolean;
};

export function FreetextReviewOverlaySection({
  review,
  showSummary = true,
  showDimensions = false,
}: FreetextReviewOverlaySectionProps) {
  const hasSummary = showSummary && review.summaryFeedback.trim().length > 0;
  const hasAdvice = showSummary && (review.nextStepAdvice?.trim().length ?? 0) > 0;
  const hasDimensions = showDimensions && (review.dimensions?.length ?? 0) > 0;

  if (!hasSummary && !hasAdvice && !hasDimensions) {
    return null;
  }

  return (
    <section
      className="space-y-3 rounded-lg border border-border bg-background/60 p-3"
      aria-label="Valutazione del testo"
    >
      <p className="text-sm font-medium text-muted-foreground">Valutazione</p>
      {hasSummary ? <p className={TASK_PLAY_BODY_TEXT}>{review.summaryFeedback}</p> : null}
      {hasAdvice ? <p className={TASK_PLAY_META_TEXT}>{review.nextStepAdvice}</p> : null}
      {hasDimensions ? (
        <ul className="space-y-2">
          {review.dimensions!.map((dim) => (
            <li key={dim.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm font-medium">
                <span>{dim.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {Math.round(dim.score * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(dim.score * 100)}%` }}
                />
              </div>
              <p className={TASK_PLAY_META_TEXT}>{dim.feedback}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
