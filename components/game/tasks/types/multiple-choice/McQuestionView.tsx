"use client";

import { McOptionList } from "@/components/game/tasks/types/multiple-choice/McOptionList";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
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
  onChange,
}: McQuestionViewProps) {
  const multi = isMcMultiSelect(question.selectionMode);
  const showProgress = questionCount > 1;
  const promptText = question.prompt?.trim() || `Domanda ${questionIndex + 1}`;

  const beforeScroll = (
    <>
      {validationError ? (
        <p className="shrink-0 text-sm text-destructive" role="alert">
          {validationError}
        </p>
      ) : null}
      {showProgress ? (
        <p className="shrink-0 text-xs text-muted-foreground">
          Domanda {questionIndex + 1} di {questionCount}
        </p>
      ) : null}
      {multi ? (
        <p className="shrink-0 text-xs text-muted-foreground">Seleziona tutte le risposte corrette.</p>
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
          onChange={onChange}
        />
      )}
    </TaskBodyLayout>
  );
}
