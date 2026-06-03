"use client";

import type { RunSceneDto } from "@/lib/api-client";
import { readTaskScenePrompt } from "@/lib/game/scene-display";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import { TaskPlaceholder } from "@/components/game/tasks/TaskPlaceholder";
import { MultipleChoiceTask } from "@/components/game/tasks/types/multiple-choice/MultipleChoiceTask";
import { MC_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/multiple-choice/normalize-mc-content";
import type { McSelectionsDraft } from "@/lib/game/tasks/multiple-choice/mc-types";

type TaskPanelProps = {
  scene: RunSceneDto;
  mcSelections: McSelectionsDraft | null;
  mcQuestionIndex: number;
  mcValidationError?: string | null;
  taskDisabled?: boolean;
  onMcSelectionsChange: (selections: McSelectionsDraft) => void;
};

export function TaskPanel({
  scene,
  mcSelections,
  mcQuestionIndex,
  mcValidationError,
  taskDisabled,
  onMcSelectionsChange,
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

  const flatPrompt = readTaskScenePrompt(scene);

  return (
    <TaskBodyLayout prompt={flatPrompt}>
      <TaskPlaceholder screenType={scene.screen_type} />
    </TaskBodyLayout>
  );
}
