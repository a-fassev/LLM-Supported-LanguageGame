"use client";

import { useMemo } from "react";
import type { RunSceneDto } from "@/lib/api-client";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import { ErrorSpottingChip } from "@/components/game/tasks/types/error-spotting/ErrorSpottingChip";
import { ErrorSpottingInlineField } from "@/components/game/tasks/types/error-spotting/ErrorSpottingInlineField";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { readTaskScenePrompt } from "@/lib/game/scene-display";
import { formatErrorSpottingCaption } from "@/lib/game/tasks/error-spotting/format-error-spotting-caption";
import {
  createEmptyErrorSpottingDraft,
  ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE,
  normalizeErrorSpottingContentResult,
} from "@/lib/game/tasks/error-spotting/normalize-error-spotting-content";
import type { ErrorSpottingDraft } from "@/lib/game/tasks/error-spotting/error-spotting-types";

type ErrorSpottingTaskProps = {
  scene: RunSceneDto;
  draft: ErrorSpottingDraft | null;
  validationError?: string | null;
  disabled?: boolean;
  onDraftChange: (draft: ErrorSpottingDraft) => void;
};

export function ErrorSpottingTask({
  scene,
  draft,
  validationError,
  disabled,
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
      const nextSelected = activeDraft.selectedSegmentIds.filter((id) => id !== segmentId);
      const nextCorrections = { ...activeDraft.corrections };
      delete nextCorrections[segmentId];
      onDraftChange({ selectedSegmentIds: nextSelected, corrections: nextCorrections });
      return;
    }

    onDraftChange({
      selectedSegmentIds: [...activeDraft.selectedSegmentIds, segmentId],
      corrections: { ...activeDraft.corrections, [segmentId]: activeDraft.corrections[segmentId] ?? "" },
    });
  }

  function updateCorrection(segmentId: string, value: string) {
    onDraftChange({
      selectedSegmentIds: activeDraft.selectedSegmentIds,
      corrections: { ...activeDraft.corrections, [segmentId]: value },
    });
  }

  if (!normalizedResult.ok || !content) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {validationError ?? ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE}
      </p>
    );
  }

  return (
    <TaskBodyLayout
      prompt={prompt}
      beforeScroll={
        <>
          {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
          {validationError ? (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          ) : null}
        </>
      }
    >
      <p className="flex flex-wrap items-baseline gap-x-0.5 gap-y-1.5 text-sm leading-relaxed">
        {content.segments.map((segment) => {
            const segmentLabel = segment.text.trim() || segment.id;
            const marked = selectedIds.has(segment.id);
            if (marked) {
              return (
                <ErrorSpottingInlineField
                  key={segment.id}
                  value={activeDraft.corrections[segment.id] ?? ""}
                  segmentText={segment.text}
                  hint={segment.hint}
                  ariaLabel={`Correzione per ${segmentLabel}`}
                  clearLabel={`Rimuovi selezione per ${segmentLabel}`}
                  disabled={disabled}
                  onChange={(value) => updateCorrection(segment.id, value)}
                  onClear={() => toggleSegment(segment.id)}
                />
              );
            }

            return (
              <ErrorSpottingChip
                key={segment.id}
                text={segment.text}
                hint={segment.hint}
                disabled={disabled}
                onToggle={() => toggleSegment(segment.id)}
              />
            );
          })}
      </p>
    </TaskBodyLayout>
  );
}
