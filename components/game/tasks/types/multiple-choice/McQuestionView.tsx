"use client";

import { McOptionList } from "@/components/game/tasks/types/multiple-choice/McOptionList";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import { cn } from "@/lib/utils";
import { TASK_PLAY_META_TEXT, TASK_PLAY_VALIDATION_ERROR_TEXT } from "@/lib/game/task-typography";
import { isMcMultiSelect } from "@/lib/game/tasks/multiple-choice/normalize-mc-content";
import type { McOptionView } from "@/lib/game/tasks/multiple-choice/mc-types";
import type { NormalizedMcQuestion } from "@/lib/game/tasks/multiple-choice/mc-types";

type McQuestionViewProps = {
  question: NormalizedMcQuestion;
  questionIndex: number;
  questionCount: number;
  displayOptions: McOptionView[];
  selectedIds: string[];
  validationError?: string | null;
  disabled?: boolean;
  reviewMode?: boolean;
  correctOptionIds?: string[];
  onChange: (selectedIds: string[]) => void;
};

export function McQuestionView({
  question,
  questionIndex,
  questionCount,
  displayOptions,
  selectedIds,
  validationError,
  disabled,
  reviewMode,
  correctOptionIds,
  onChange,
}: McQuestionViewProps) {
  const multi = isMcMultiSelect(question.selectionMode);
  const showProgress = questionCount > 1;
  const promptText = question.prompt?.trim() || `Domanda ${questionIndex + 1}`;

  const beforeScroll = (
    <>
      {validationError ? (
        <p className={cn("shrink-0", TASK_PLAY_VALIDATION_ERROR_TEXT)} role="alert">
          {validationError}
        </p>
      ) : null}
      {showProgress ? (
        <p className={cn("shrink-0", TASK_PLAY_META_TEXT)}>
          Domanda {questionIndex + 1} di {questionCount}
        </p>
      ) : null}
      {multi ? (
        <p className={cn("shrink-0", TASK_PLAY_META_TEXT)}>Seleziona tutte le risposte corrette.</p>
      ) : null}
    </>
  );

  return (
    <TaskBodyLayout prompt={promptText} beforeScroll={beforeScroll}>
      {(promptLabelId) => (
        <McOptionList
          selectionMode={question.selectionMode}
          options={displayOptions}
          selectedIds={selectedIds}
          groupLabelId={promptLabelId}
          disabled={disabled}
          reviewMode={reviewMode}
          correctOptionIds={correctOptionIds}
          onChange={onChange}
        />
      )}
    </TaskBodyLayout>
  );
}
