"use client";

import type { RunSceneDto } from "@/lib/api-client";
import { readTaskScenePrompt } from "@/lib/game/scene-display";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import { TaskPlaceholder } from "@/components/game/tasks/TaskPlaceholder";
import { MultipleChoiceTask } from "@/components/game/tasks/types/multiple-choice/MultipleChoiceTask";
import { MatchingTask } from "@/components/game/tasks/types/matching/MatchingTask";
import { DragDropTask } from "@/components/game/tasks/types/drag-drop/DragDropTask";
import { FreeTextTask } from "@/components/game/tasks/types/free-text/FreeTextTask";
import { ErrorSpottingTask } from "@/components/game/tasks/types/error-spotting/ErrorSpottingTask";
import { ClozeTextTask } from "@/components/game/tasks/types/cloze-text/ClozeTextTask";
import { MC_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/multiple-choice/normalize-mc-content";
import { MATCHING_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/matching/normalize-matching-content";
import { DRAG_DROP_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/drag-drop/normalize-drag-drop-content";
import { ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/error-spotting/normalize-error-spotting-content";
import { CLOZE_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/cloze/normalize-cloze-content";
import type { McSelectionsDraft } from "@/lib/game/tasks/multiple-choice/mc-types";
import type { MatchingPairsDraft, MatchingPairsUpdater } from "@/lib/game/tasks/matching/matching-types";
import type {
  DragDropAssignmentsDraft,
  DragDropAssignmentsUpdater,
} from "@/lib/game/tasks/drag-drop/drag-drop-types";
import type { ErrorSpottingDraft } from "@/lib/game/tasks/error-spotting/error-spotting-types";
import type { ClozeAnswersDraft } from "@/lib/game/tasks/cloze/cloze-types";
import { TASK_PLAY_ERROR_TEXT } from "@/lib/game/task-typography";

type TaskPanelProps = {
  scene: RunSceneDto;
  mcSelections: McSelectionsDraft | null;
  mcQuestionIndex: number;
  mcValidationError?: string | null;
  matchingPairs: MatchingPairsDraft | null;
  matchingValidationError?: string | null;
  dragDropAssignments: DragDropAssignmentsDraft | null;
  dragDropValidationError?: string | null;
  freetextAnswer: string;
  freetextValidationError?: string | null;
  freetextEvaluating?: boolean;
  errorSpottingDraft: ErrorSpottingDraft | null;
  errorSpottingValidationError?: string | null;
  clozeAnswers: ClozeAnswersDraft | null;
  clozeValidationError?: string | null;
  taskDisabled?: boolean;
  onMcSelectionsChange: (selections: McSelectionsDraft) => void;
  onMatchingPairsChange: (updater: MatchingPairsUpdater) => void;
  onDragDropAssignmentsChange: (updater: DragDropAssignmentsUpdater) => void;
  onFreetextAnswerChange: (value: string) => void;
  onErrorSpottingDraftChange: (draft: ErrorSpottingDraft) => void;
  onClozeAnswersChange: (answers: ClozeAnswersDraft) => void;
};

export function TaskPanel({
  scene,
  mcSelections,
  mcQuestionIndex,
  mcValidationError,
  matchingPairs,
  matchingValidationError,
  dragDropAssignments,
  dragDropValidationError,
  freetextAnswer,
  freetextValidationError,
  freetextEvaluating,
  errorSpottingDraft,
  errorSpottingValidationError,
  clozeAnswers,
  clozeValidationError,
  taskDisabled,
  onMcSelectionsChange,
  onMatchingPairsChange,
  onDragDropAssignmentsChange,
  onFreetextAnswerChange,
  onErrorSpottingDraftChange,
  onClozeAnswersChange,
}: TaskPanelProps) {
  if (scene.screen_type === "cloze") {
    if (!clozeAnswers) {
      return (
        <p className={TASK_PLAY_ERROR_TEXT} role="alert">
          {clozeValidationError ?? CLOZE_CONTENT_MISMATCH_MESSAGE}
        </p>
      );
    }

    return (
      <ClozeTextTask
        key={scene.id}
        scene={scene}
        answers={clozeAnswers}
        validationError={clozeValidationError}
        disabled={taskDisabled}
        onAnswersChange={onClozeAnswersChange}
      />
    );
  }

  if (scene.screen_type === "error_spotting") {
    if (!errorSpottingDraft) {
      return (
        <p className={TASK_PLAY_ERROR_TEXT} role="alert">
          {errorSpottingValidationError ?? ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE}
        </p>
      );
    }

    return (
      <ErrorSpottingTask
        key={scene.id}
        scene={scene}
        draft={errorSpottingDraft}
        validationError={errorSpottingValidationError}
        disabled={taskDisabled}
        onDraftChange={onErrorSpottingDraftChange}
      />
    );
  }

  if (scene.screen_type === "free_text") {
    return (
      <FreeTextTask
        key={scene.id}
        scene={scene}
        answerText={freetextAnswer}
        validationError={freetextValidationError}
        evaluating={freetextEvaluating}
        disabled={taskDisabled}
        onAnswerChange={onFreetextAnswerChange}
      />
    );
  }

  if (scene.screen_type === "multiple_choice") {
    if (!mcSelections) {
      return (
        <p className={TASK_PLAY_ERROR_TEXT} role="alert">
          {mcValidationError ?? MC_CONTENT_MISMATCH_MESSAGE}
        </p>
      );
    }

    return (
      <MultipleChoiceTask
        key={scene.id}
        scene={scene}
        selections={mcSelections}
        currentQuestionIndex={mcQuestionIndex}
        validationError={mcValidationError}
        disabled={taskDisabled}
        onSelectionsChange={onMcSelectionsChange}
      />
    );
  }

  if (scene.screen_type === "drag_drop") {
    if (!dragDropAssignments) {
      return (
        <p className={TASK_PLAY_ERROR_TEXT} role="alert">
          {dragDropValidationError ?? DRAG_DROP_CONTENT_MISMATCH_MESSAGE}
        </p>
      );
    }

    return (
      <DragDropTask
        key={scene.id}
        scene={scene}
        assignments={dragDropAssignments}
        validationError={dragDropValidationError}
        disabled={taskDisabled}
        onAssignmentsChange={onDragDropAssignmentsChange}
      />
    );
  }

  if (scene.screen_type === "matching") {
    if (!matchingPairs) {
      return (
        <p className={TASK_PLAY_ERROR_TEXT} role="alert">
          {matchingValidationError ?? MATCHING_CONTENT_MISMATCH_MESSAGE}
        </p>
      );
    }

    return (
      <MatchingTask
        key={scene.id}
        scene={scene}
        pairs={matchingPairs}
        validationError={matchingValidationError}
        disabled={taskDisabled}
        onPairsChange={onMatchingPairsChange}
      />
    );
  }

  const flatPrompt = readTaskScenePrompt(scene);

  return (
    <TaskBodyLayout prompt={flatPrompt}>
      <TaskPlaceholder screenType={scene.screen_type} />
    </TaskBodyLayout>
  );
}
