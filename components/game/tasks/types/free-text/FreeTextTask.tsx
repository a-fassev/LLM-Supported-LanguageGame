"use client";

import { useMemo } from "react";
import type { RunSceneDto } from "@/lib/api-client";
import { Textarea } from "@/components/ui/textarea";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { readTaskSceneInstruction, readTaskScenePrompt } from "@/lib/game/scene-display";
import {
  FREITEXT_EVALUATING_MESSAGE,
  FREITEXT_TEXTAREA_PLACEHOLDER,
} from "@/lib/game/tasks/freitext/freitext-messages";
import { formatFreitextStatsLine } from "@/lib/game/tasks/freitext/freitext-stats-line";
import {
  FREITEXT_CONTENT_MISMATCH_MESSAGE,
  normalizeFreitextContentResult,
} from "@/lib/game/tasks/freitext/normalize-freitext-content";

type FreeTextTaskProps = {
  scene: RunSceneDto;
  answerText: string;
  validationError?: string | null;
  evaluating?: boolean;
  disabled?: boolean;
  onAnswerChange: (value: string) => void;
};

export function FreeTextTask({
  scene,
  answerText,
  validationError,
  evaluating,
  disabled,
  onAnswerChange,
}: FreeTextTaskProps) {
  const normalizedResult = useMemo(
    () => normalizeFreitextContentResult(getTaskPayload(scene), readTaskSceneInstruction(scene)),
    [scene],
  );

  const content = normalizedResult.ok ? normalizedResult.content : null;
  const prompt = content?.prompt ?? readTaskScenePrompt(scene);
  const statsLine = content ? formatFreitextStatsLine(content, answerText) : null;
  const fieldDisabled = disabled || evaluating;

  if (!normalizedResult.ok) {
    return <p className="text-sm text-destructive">{FREITEXT_CONTENT_MISMATCH_MESSAGE}</p>;
  }

  return (
    <TaskBodyLayout
      fillScroll
      prompt={prompt}
      beforeScroll={
        <>
          {evaluating ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {FREITEXT_EVALUATING_MESSAGE}
            </p>
          ) : null}
          {validationError ? (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          ) : null}
          {statsLine ? <p className="text-xs text-muted-foreground">{statsLine}</p> : null}
        </>
      }
    >
      <div className="flex h-full min-h-0 w-full flex-col">
        <Textarea
          value={answerText}
          onChange={(event) => onAnswerChange(event.target.value)}
          disabled={fieldDisabled}
          placeholder={FREITEXT_TEXTAREA_PLACEHOLDER}
          className="h-full min-h-0 flex-1 resize-none text-sm focus-visible:border-ring focus-visible:ring-0"
          aria-label={prompt ?? "Risposta"}
        />
      </div>
    </TaskBodyLayout>
  );
}
