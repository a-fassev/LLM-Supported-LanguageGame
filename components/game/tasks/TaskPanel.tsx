"use client";

import type { RunSceneDto } from "@/lib/api-client";
import { readTaskScenePrompt } from "@/lib/game/scene-display";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import { TaskPlaceholder } from "@/components/game/tasks/TaskPlaceholder";
import { MultipleChoiceTask } from "@/components/game/tasks/types/multiple-choice/MultipleChoiceTask";
import { MatchingTask } from "@/components/game/tasks/types/matching/MatchingTask";
import { DragDropTask } from "@/components/game/tasks/types/drag-drop/DragDropTask";
import { MC_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/multiple-choice/normalize-mc-content";
import { MATCHING_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/matching/normalize-matching-content";
import { DRAG_DROP_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/drag-drop/normalize-drag-drop-content";
import type { McSelectionsDraft } from "@/lib/game/tasks/multiple-choice/mc-types";
import type { MatchingPairsDraft, MatchingPairsUpdater } from "@/lib/game/tasks/matching/matching-types";
import type {
  DragDropAssignmentsDraft,
  DragDropAssignmentsUpdater,
} from "@/lib/game/tasks/drag-drop/drag-drop-types";

type TaskPanelProps = {
  scene: RunSceneDto;
  mcSelections: McSelectionsDraft | null;
  mcQuestionIndex: number;
  mcValidationError?: string | null;
  matchingPairs: MatchingPairsDraft | null;
  matchingValidationError?: string | null;
  dragDropAssignments: DragDropAssignmentsDraft | null;
  dragDropValidationError?: string | null;
  taskDisabled?: boolean;
  onMcSelectionsChange: (selections: McSelectionsDraft) => void;
  onMatchingPairsChange: (updater: MatchingPairsUpdater) => void;
  onDragDropAssignmentsChange: (updater: DragDropAssignmentsUpdater) => void;
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
  taskDisabled,
  onMcSelectionsChange,
  onMatchingPairsChange,
  onDragDropAssignmentsChange,
}: TaskPanelProps) {
  if (scene.screen_type === "multiple_choice") {
    if (!mcSelections) {
      return (
        <p className="text-sm text-destructive" role="alert">
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
        <p className="text-sm text-destructive" role="alert">
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
        <p className="text-sm text-destructive" role="alert">
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
