"use client";

import { useMemo } from "react";
import type { ClozeTaskReview, RunSceneDto } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { readTaskScenePrompt } from "@/lib/game/scene-display";
import { countClozeGaps } from "@/lib/game/tasks/cloze/cloze-gap-order";
import {
  CLOZE_CONTENT_MISMATCH_MESSAGE,
  normalizeClozeContentResult,
} from "@/lib/game/tasks/cloze/normalize-cloze-content";
import { CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE } from "@/lib/game/tasks/cloze/cloze-types";
import { cn } from "@/lib/utils";
import {
  TASK_REVIEW_CORRECT,
  TASK_REVIEW_HINT_TEXT,
  TASK_REVIEW_INCORRECT,
} from "@/lib/game/task-review-styles";
import {
  TASK_PLAY_BODY_TEXT,
  TASK_PLAY_ERROR_TEXT,
  TASK_PLAY_INLINE_FIELD_TEXT,
  TASK_PLAY_VALIDATION_ERROR_TEXT,
} from "@/lib/game/task-typography";
import type { ClozeAnswersDraft } from "@/lib/game/tasks/cloze/cloze-types";
import type { ClozeTextClientContentParsed } from "@/lib/game/schemas/clozeTextContentSchema";

type ClozeTextTaskProps = {
  scene: RunSceneDto;
  answers: ClozeAnswersDraft;
  validationError?: string | null;
  disabled?: boolean;
  reviewMode?: boolean;
  taskReview?: ClozeTaskReview;
  onAnswersChange: (answers: ClozeAnswersDraft) => void;
};

type ClozeRenderSegment =
  | { kind: "text"; key: string; text: string }
  | { kind: "gap"; key: string; gapIndex: number; maxLength?: number };

/** Compact starting width; grows with typed content via field-sizing. */
function gapInputMinWidthCh(maxLength: number | undefined): number {
  const base = maxLength ?? 12;
  // Authoring often sets maxLength to 64 for every gap — not a display hint.
  if (base > 24) {
    return 8;
  }
  return Math.min(14, Math.max(5, base));
}

const CLOZE_GAP_INPUT_CLASS =
  "mx-0.5 inline-block h-[1.35em] min-h-0 w-auto min-w-[5ch] max-w-[20ch] shrink-0 px-1 py-0 align-baseline [field-sizing:content] focus-visible:border-ring focus-visible:ring-0";

function buildRenderLines(content: ClozeTextClientContentParsed): ClozeRenderSegment[][] {
  const rows: ClozeRenderSegment[][] = [];
  let gapIndex = 0;

  for (let lineIndex = 0; lineIndex < content.lines.length; lineIndex++) {
    const row: ClozeRenderSegment[] = [];
    const line = content.lines[lineIndex];
    for (let segmentIndex = 0; segmentIndex < line.segments.length; segmentIndex++) {
      const segment = line.segments[segmentIndex];
      const key = `${lineIndex}-${segmentIndex}`;
      if (segment.kind === "text") {
        row.push({ kind: "text", key, text: segment.text });
        continue;
      }
      row.push({
        kind: "gap",
        key,
        gapIndex,
        maxLength: segment.maxLength,
      });
      gapIndex += 1;
    }
    rows.push(row);
  }

  return rows;
}

export function ClozeTextTask({
  scene,
  answers,
  validationError,
  disabled,
  reviewMode,
  taskReview,
  onAnswersChange,
}: ClozeTextTaskProps) {
  const normalizedResult = useMemo(() => normalizeClozeContentResult(getTaskPayload(scene)), [scene]);
  const content = normalizedResult.ok ? normalizedResult.content : null;
  const gapCount = content ? countClozeGaps(content.lines) : 0;
  const renderLines = useMemo(() => (content ? buildRenderLines(content) : []), [content]);
  const prompt = content?.prompt ?? readTaskScenePrompt(scene);

  if (!normalizedResult.ok) {
    return (
      <p className={TASK_PLAY_ERROR_TEXT} role="alert">
        {CLOZE_CONTENT_MISMATCH_MESSAGE}
      </p>
    );
  }

  if (!content || answers.length !== gapCount) {
    return (
      <p className={TASK_PLAY_ERROR_TEXT} role="alert">
        {CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE}
      </p>
    );
  }

  return (
    <TaskBodyLayout
      prompt={prompt}
      beforeScroll={
        validationError ? (
          <p className={TASK_PLAY_VALIDATION_ERROR_TEXT} role="alert">
            {validationError}
          </p>
        ) : null
      }
    >
      <div className="space-y-3">
        {renderLines.map((row, lineIndex) => (
          <p key={`line-${lineIndex}`} className={TASK_PLAY_BODY_TEXT}>
            {row.map((segment) => {
              if (segment.kind === "text") {
                const hasNewline = segment.text.includes("\n");
                return (
                  <span key={segment.key} className={cn(hasNewline && "whitespace-pre-wrap")}>
                    {segment.text}
                  </span>
                );
              }

              const minWidthCh = gapInputMinWidthCh(segment.maxLength);
              const gapReview = taskReview?.gaps.find((g) => g.gapIndex === segment.gapIndex);
              const reviewActive = reviewMode && gapReview;
              const exampleWord = gapReview?.acceptedAnswers[0];
              const altWords = gapReview?.acceptedAnswers.slice(1, 3) ?? [];
              const showReviewHint = reviewActive && !gapReview.isCorrect && exampleWord;

              const gapInput = (
                <Input
                  type="text"
                  name={`cloze-${scene.id}-g${segment.gapIndex}`}
                  value={answers[segment.gapIndex] ?? ""}
                  disabled={disabled || reviewMode}
                  readOnly={reviewMode}
                  maxLength={segment.maxLength}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  data-1p-ignore
                  data-lpignore="true"
                  aria-label={`Lacuna ${segment.gapIndex + 1} di ${gapCount}`}
                  className={cn(
                    CLOZE_GAP_INPUT_CLASS,
                    TASK_PLAY_INLINE_FIELD_TEXT,
                    reviewActive &&
                      (gapReview.isCorrect ? TASK_REVIEW_CORRECT : TASK_REVIEW_INCORRECT),
                  )}
                  style={{ minWidth: `${minWidthCh}ch` }}
                  onChange={(event) => {
                    const next = [...answers];
                    next[segment.gapIndex] = event.target.value;
                    onAnswersChange(next);
                  }}
                />
              );

              if (showReviewHint) {
                return (
                  <span key={segment.key} className="inline-block align-baseline">
                    {gapInput}
                    <span className={cn(TASK_REVIEW_HINT_TEXT, "mt-0.5 block")}>
                      Esempio: {exampleWord}
                      {altWords.length > 0 ? ` · Anche: ${altWords.join(", ")}` : ""}
                    </span>
                  </span>
                );
              }

              return <span key={segment.key}>{gapInput}</span>;
            })}
          </p>
        ))}
      </div>
    </TaskBodyLayout>
  );
}
