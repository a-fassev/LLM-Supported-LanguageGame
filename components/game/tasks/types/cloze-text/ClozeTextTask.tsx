"use client";

import { useMemo } from "react";
import type { RunSceneDto } from "@/lib/api-client";
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
import type { ClozeAnswersDraft } from "@/lib/game/tasks/cloze/cloze-types";
import type { ClozeTextClientContentParsed } from "@/lib/game/schemas/clozeTextContentSchema";

type ClozeTextTaskProps = {
  scene: RunSceneDto;
  answers: ClozeAnswersDraft;
  validationError?: string | null;
  disabled?: boolean;
  onAnswersChange: (answers: ClozeAnswersDraft) => void;
};

type ClozeRenderSegment =
  | { kind: "text"; key: string; text: string }
  | { kind: "gap"; key: string; gapIndex: number; placeholder?: string; maxLength?: number };

function gapInputWidthCh(maxLength: number | undefined): number {
  const base = maxLength ?? 16;
  return Math.min(24, Math.max(8, base));
}

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
        placeholder: segment.placeholder,
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
  onAnswersChange,
}: ClozeTextTaskProps) {
  const normalizedResult = useMemo(() => normalizeClozeContentResult(getTaskPayload(scene)), [scene]);
  const content = normalizedResult.ok ? normalizedResult.content : null;
  const gapCount = content ? countClozeGaps(content.lines) : 0;
  const renderLines = useMemo(() => (content ? buildRenderLines(content) : []), [content]);
  const prompt = content?.prompt ?? readTaskScenePrompt(scene);

  if (!normalizedResult.ok) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {CLOZE_CONTENT_MISMATCH_MESSAGE}
      </p>
    );
  }

  if (!content || answers.length !== gapCount) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE}
      </p>
    );
  }

  return (
    <TaskBodyLayout
      prompt={prompt}
      beforeScroll={
        validationError ? (
          <p className="text-sm text-destructive" role="alert">
            {validationError}
          </p>
        ) : null
      }
    >
      <div className="space-y-3">
        {renderLines.map((row, lineIndex) => (
          <div key={`line-${lineIndex}`} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2">
            {row.map((segment) => {
              if (segment.kind === "text") {
                const hasNewline = segment.text.includes("\n");
                return (
                  <span
                    key={segment.key}
                    className={`text-sm ${hasNewline ? "whitespace-pre-wrap" : ""}`}
                  >
                    {segment.text}
                  </span>
                );
              }

              const widthCh = gapInputWidthCh(segment.maxLength);
              return (
                <Input
                  key={segment.key}
                  type="text"
                  value={answers[segment.gapIndex] ?? ""}
                  disabled={disabled}
                  placeholder={segment.placeholder ?? "…"}
                  maxLength={segment.maxLength}
                  aria-label={`Lacuna ${segment.gapIndex + 1} di ${gapCount}`}
                  className="inline-flex h-11 min-h-11 shrink-0 px-2 text-sm"
                  style={{ width: `${widthCh}ch` }}
                  onChange={(event) => {
                    const next = [...answers];
                    next[segment.gapIndex] = event.target.value;
                    onAnswersChange(next);
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </TaskBodyLayout>
  );
}
