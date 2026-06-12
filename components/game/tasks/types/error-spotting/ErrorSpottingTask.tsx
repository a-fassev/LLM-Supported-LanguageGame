"use client";

import { useMemo } from "react";
import type { ErrorSpottingTaskReview, RunSceneDto } from "@/lib/api-client";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import { cn } from "@/lib/utils";
import { ErrorSpottingChip } from "@/components/game/tasks/types/error-spotting/ErrorSpottingChip";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { readTaskScenePrompt } from "@/lib/game/scene-display";
import { formatErrorSpottingCaption } from "@/lib/game/tasks/error-spotting/format-error-spotting-caption";
import {
  createEmptyErrorSpottingDraft,
  ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE,
  normalizeErrorSpottingContentResult,
} from "@/lib/game/tasks/error-spotting/normalize-error-spotting-content";
import {
  TASK_REVIEW_CORRECT,
  TASK_REVIEW_HINT_TEXT,
  TASK_REVIEW_INCORRECT,
  TASK_REVIEW_MISSED,
} from "@/lib/game/task-review-styles";
import {
  TASK_PLAY_BODY_TEXT,
  TASK_PLAY_ERROR_TEXT,
  TASK_PLAY_META_TEXT,
  TASK_PLAY_VALIDATION_ERROR_TEXT,
} from "@/lib/game/task-typography";
import type { ErrorSpottingDraft } from "@/lib/game/tasks/error-spotting/error-spotting-types";

type ErrorSpottingTaskProps = {
  scene: RunSceneDto;
  draft: ErrorSpottingDraft | null;
  validationError?: string | null;
  disabled?: boolean;
  reviewMode?: boolean;
  taskReview?: ErrorSpottingTaskReview;
  onDraftChange: (draft: ErrorSpottingDraft) => void;
};

export function ErrorSpottingTask({
  scene,
  draft,
  validationError,
  disabled,
  reviewMode,
  taskReview,
  onDraftChange,
}: ErrorSpottingTaskProps) {
  const normalizedResult = useMemo(() => normalizeErrorSpottingContentResult(getTaskPayload(scene)), [scene]);
  const content = normalizedResult.ok ? normalizedResult.content : null;
  const prompt = content?.prompt ?? readTaskScenePrompt(scene);
  const activeDraft = draft ?? createEmptyErrorSpottingDraft();

  const selectedIds = useMemo(
    () => new Set(activeDraft.selectedSegmentIds),
    [activeDraft.selectedSegmentIds],
  );

  const caption = content
    ? formatErrorSpottingCaption({
        errorCount: content.errorCount,
        expectedErrorRange: content.expectedErrorRange,
        counterCaption: content.counterCaption,
      })
    : null;

  function toggleSegment(segmentId: string) {
    if (selectedIds.has(segmentId)) {
      onDraftChange({
        selectedSegmentIds: activeDraft.selectedSegmentIds.filter((id) => id !== segmentId),
      });
      return;
    }

    onDraftChange({
      selectedSegmentIds: [...activeDraft.selectedSegmentIds, segmentId],
    });
  }

  if (!normalizedResult.ok || !content) {
    return (
      <p className={TASK_PLAY_ERROR_TEXT} role="alert">
        {validationError ?? ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE}
      </p>
    );
  }

  return (
    <TaskBodyLayout
      prompt={prompt}
      beforeScroll={
        <>
          {caption ? <p className={TASK_PLAY_META_TEXT}>{caption}</p> : null}
          {validationError ? (
            <p className={TASK_PLAY_VALIDATION_ERROR_TEXT} role="alert">
              {validationError}
            </p>
          ) : null}
        </>
      }
    >
      <p className={cn("flex flex-wrap items-baseline gap-x-0.5 gap-y-1.5", TASK_PLAY_BODY_TEXT)}>
        {content.segments.map((segment) => {
            const segmentReview = taskReview?.segments.find((s) => s.segmentId === segment.id);
            const marked = selectedIds.has(segment.id);
            const reviewHint = (() => {
              if (!reviewMode || !segmentReview) return null;
              if (segmentReview.isFalsePositive) {
                return "Non era un errore.";
              }
              if (segmentReview.isError && !segmentReview.wasSelected) {
                const example = segmentReview.acceptedCorrections[0];
                return example ? `Corretto: ${example}` : "Errore non trovato.";
              }
              return null;
            })();
            const reviewWrapClass =
              reviewMode && segmentReview
                ? segmentReview.isFalsePositive
                  ? "rounded px-0.5 opacity-70"
                  : segmentReview.isError && !segmentReview.wasSelected
                    ? `rounded px-0.5 ${TASK_REVIEW_MISSED}`
                    : segmentReview.isError && segmentReview.foundCorrect === true
                      ? `rounded px-0.5 ${TASK_REVIEW_CORRECT}`
                      : segmentReview.isError && segmentReview.foundCorrect === false
                        ? `rounded px-0.5 ${TASK_REVIEW_INCORRECT}`
                        : ""
                : "";

            return (
              <span key={segment.id} className={cn("inline-flex flex-col gap-0.5", reviewWrapClass)}>
                <ErrorSpottingChip
                  text={segment.text}
                  hint={segment.hint}
                  selected={marked}
                  disabled={disabled || reviewMode}
                  onToggle={() => toggleSegment(segment.id)}
                />
                {reviewHint ? <span className={TASK_REVIEW_HINT_TEXT}>{reviewHint}</span> : null}
              </span>
            );
          })}
      </p>
    </TaskBodyLayout>
  );
}
