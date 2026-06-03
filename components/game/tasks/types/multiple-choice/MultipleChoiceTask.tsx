"use client";

import { useMemo } from "react";
import type { RunSceneDto } from "@/lib/api-client";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { McQuestionView } from "@/components/game/tasks/types/multiple-choice/McQuestionView";
import { getStableMcDisplayOptions } from "@/lib/game/tasks/multiple-choice/mc-display-options";
import {
  MC_CONTENT_MISMATCH_MESSAGE,
  normalizeMcContentResult,
} from "@/lib/game/tasks/multiple-choice/normalize-mc-content";
import { TASK_PLAY_ERROR_TEXT, TASK_PLAY_META_TEXT } from "@/lib/game/task-typography";
import type { McOptionView } from "@/lib/game/tasks/multiple-choice/mc-types";
import type { McSelectionsDraft } from "@/lib/game/tasks/multiple-choice/mc-types";

type MultipleChoiceTaskProps = {
  scene: RunSceneDto;
  selections: McSelectionsDraft;
  currentQuestionIndex: number;
  validationError?: string | null;
  disabled?: boolean;
  onSelectionsChange: (selections: McSelectionsDraft) => void;
};

export function MultipleChoiceTask({
  scene,
  selections,
  currentQuestionIndex,
  validationError,
  disabled,
  onSelectionsChange,
}: MultipleChoiceTaskProps) {
  const normalizedResult = useMemo(() => normalizeMcContentResult(getTaskPayload(scene)), [scene]);
  const optionOrderCache = useMemo(() => new Map<string, McOptionView[]>(), []);

  const content = normalizedResult.ok ? normalizedResult.content : null;
  const questionCount = content?.questions.length ?? 0;
  const safeIndex = Math.min(Math.max(0, currentQuestionIndex), Math.max(0, questionCount - 1));
  const question = content?.questions[safeIndex];

  const displayOptions = useMemo(() => {
    if (!question) return [];
    const cacheKey = `${scene.id}:${question.id ?? `idx-${safeIndex}`}`;
    return getStableMcDisplayOptions(question, cacheKey, optionOrderCache);
  }, [question, optionOrderCache, safeIndex, scene.id]);

  if (!normalizedResult.ok) {
    return <p className={TASK_PLAY_ERROR_TEXT}>{MC_CONTENT_MISMATCH_MESSAGE}</p>;
  }

  if (!question || !content) {
    return <p className={TASK_PLAY_META_TEXT}>Contenuto della domanda non disponibile.</p>;
  }

  const selectedIds = selections[safeIndex] ?? [];
  return (
    <McQuestionView
      question={question}
      questionIndex={safeIndex}
      questionCount={content.questions.length}
      displayOptions={displayOptions}
      selectedIds={selectedIds}
      validationError={validationError}
      disabled={disabled}
      onChange={(nextIds) => {
        const next = selections.map((row, index) => (index === safeIndex ? nextIds : row));
        onSelectionsChange(next);
      }}
    />
  );
}
