"use client";

import { useMemo } from "react";
import type { RunSceneDto, TaskOutcomeDto, TaskReviewDto } from "@/lib/api-client";
import { StoryPanel } from "@/components/game/shell/StoryPanel";
import { TaskChrome } from "@/components/game/shell/TaskChrome";
import { TaskPanel } from "@/components/game/tasks/TaskPanel";
import { Button } from "@/components/ui/button";
import { readTaskChromeInstructions } from "@/lib/game/scene-display";
import { getMcQuestionNavState } from "@/lib/game/tasks/multiple-choice/mc-question-nav";
import type { McSelectionsDraft } from "@/lib/game/tasks/multiple-choice/mc-types";
import type { MatchingPairsDraft, MatchingPairsUpdater } from "@/lib/game/tasks/matching/matching-types";
import type {
  DragDropAssignmentsDraft,
  DragDropAssignmentsUpdater,
} from "@/lib/game/tasks/drag-drop/drag-drop-types";
import type { ErrorSpottingDraft } from "@/lib/game/tasks/error-spotting/error-spotting-types";
import type { ClozeAnswersDraft } from "@/lib/game/tasks/cloze/cloze-types";

type SceneRouterProps = {
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
  errorSpottingDraft: ErrorSpottingDraft | null;
  errorSpottingValidationError?: string | null;
  clozeAnswers: ClozeAnswersDraft | null;
  clozeValidationError?: string | null;
  canRetreat: boolean;
  sceneNavPending: boolean;
  taskSubmitting: boolean;
  reviewMode?: boolean;
  taskReview?: TaskReviewDto | null;
  /** After «Mostra soluzione», footer primary continues the attempt flow (Avanti / Riprova). */
  postAttemptOutcome?: TaskOutcomeDto | null;
  postAttemptContinueLabel?: string;
  onPostAttemptContinue?: () => void;
  onMcSelectionsChange: (selections: McSelectionsDraft) => void;
  onMcQuestionIndexChange: (index: number) => void;
  onMatchingPairsChange: (updater: MatchingPairsUpdater) => void;
  onDragDropAssignmentsChange: (updater: DragDropAssignmentsUpdater) => void;
  onFreetextAnswerChange: (value: string) => void;
  onErrorSpottingDraftChange: (draft: ErrorSpottingDraft) => void;
  onClozeAnswersChange: (answers: ClozeAnswersDraft) => void;
  onAdvanceStory: () => void;
  onRetreatScene: () => void;
  onSubmitTask: () => void;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function storyText(scene: RunSceneDto): string {
  const content = scene.content;
  return (
    readString(content.text) ??
    readString(content.body) ??
    "La storia continua... premi «Avanti» per proseguire."
  );
}

export function SceneRouter({
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
  errorSpottingDraft,
  errorSpottingValidationError,
  clozeAnswers,
  clozeValidationError,
  canRetreat,
  sceneNavPending,
  taskSubmitting,
  reviewMode,
  taskReview,
  postAttemptOutcome,
  postAttemptContinueLabel,
  onPostAttemptContinue,
  onMcSelectionsChange,
  onMcQuestionIndexChange,
  onMatchingPairsChange,
  onDragDropAssignmentsChange,
  onFreetextAnswerChange,
  onErrorSpottingDraftChange,
  onClozeAnswersChange,
  onAdvanceStory,
  onRetreatScene,
  onSubmitTask,
}: SceneRouterProps) {
  const mcNav = useMemo(
    () => getMcQuestionNavState(scene, mcQuestionIndex),
    [scene.id, scene.screen_type, mcQuestionIndex],
  );

  if (scene.scene_type === "story") {
    return (
      <div className="flex h-full min-h-0 w-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <StoryPanel text={storyText(scene)} />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 pt-3">
          <Button
            size="lg"
            variant="outline"
            onClick={onRetreatScene}
            disabled={!canRetreat || sceneNavPending}
          >
            {sceneNavPending ? "..." : "Indietro"}
          </Button>
          <Button size="lg" onClick={onAdvanceStory} disabled={sceneNavPending}>
            {sceneNavPending ? "Avanzamento..." : "Avanti"}
          </Button>
        </div>
      </div>
    );
  }

  const multiQuestionMc = mcNav != null && mcNav.questionCount > 1;
  const inPostAttemptContinue = postAttemptOutcome != null;
  const reviewMcBetweenQuestions =
    inPostAttemptContinue && multiQuestionMc && mcNav != null && !mcNav.isLastQuestion;

  function handleTaskPrimary() {
    if (reviewMcBetweenQuestions && mcNav) {
      onMcQuestionIndexChange(mcQuestionIndex + 1);
      return;
    }
    if (inPostAttemptContinue) {
      onPostAttemptContinue?.();
      return;
    }
    if (multiQuestionMc && mcNav && !mcNav.isLastQuestion) {
      onMcQuestionIndexChange(mcQuestionIndex + 1);
      return;
    }
    void onSubmitTask();
  }

  function handleTaskRetreat() {
    if (inPostAttemptContinue && multiQuestionMc && mcNav && !mcNav.isFirstQuestion) {
      onMcQuestionIndexChange(mcQuestionIndex - 1);
      return;
    }
    if (inPostAttemptContinue) {
      return;
    }
    if (multiQuestionMc && mcNav && !mcNav.isFirstQuestion) {
      onMcQuestionIndexChange(mcQuestionIndex - 1);
      return;
    }
    void onRetreatScene();
  }

  const primaryLabel = reviewMcBetweenQuestions
    ? "Avanti"
    : inPostAttemptContinue
      ? (postAttemptContinueLabel ?? "Avanti")
      : taskSubmitting
        ? multiQuestionMc && mcNav && !mcNav.isLastQuestion
          ? "..."
          : "Controllo..."
        : multiQuestionMc && mcNav && !mcNav.isLastQuestion
          ? "Avanti"
          : "Controlla";

  const retreatWithinQuestions = multiQuestionMc && mcNav != null && !mcNav.isFirstQuestion;
  const retreatDisabled = inPostAttemptContinue
    ? !retreatWithinQuestions
    : sceneNavPending ||
      taskSubmitting ||
      (!retreatWithinQuestions && !canRetreat);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <TaskChrome
        instructions={readTaskChromeInstructions(scene)}
        primaryLabel={primaryLabel}
        primaryDisabled={taskSubmitting && !inPostAttemptContinue}
        canRetreat={
          inPostAttemptContinue ? retreatWithinQuestions : canRetreat || retreatWithinQuestions
        }
        retreatDisabled={retreatDisabled}
        retreatLabel={sceneNavPending ? "..." : "Indietro"}
        onRetreat={handleTaskRetreat}
        onPrimary={handleTaskPrimary}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <TaskPanel
          scene={scene}
          mcSelections={mcSelections}
          mcQuestionIndex={mcQuestionIndex}
          mcValidationError={mcValidationError}
          matchingPairs={matchingPairs}
          matchingValidationError={matchingValidationError}
          dragDropAssignments={dragDropAssignments}
          dragDropValidationError={dragDropValidationError}
          freetextAnswer={freetextAnswer}
          freetextValidationError={freetextValidationError}
          freetextEvaluating={taskSubmitting && scene.screen_type === "free_text"}
          errorSpottingDraft={errorSpottingDraft}
          errorSpottingValidationError={errorSpottingValidationError}
          clozeAnswers={clozeAnswers}
          clozeValidationError={clozeValidationError}
          taskDisabled={taskSubmitting || reviewMode}
          reviewMode={reviewMode}
          taskReview={taskReview}
          onMcSelectionsChange={onMcSelectionsChange}
          onMatchingPairsChange={onMatchingPairsChange}
          onDragDropAssignmentsChange={onDragDropAssignmentsChange}
          onFreetextAnswerChange={onFreetextAnswerChange}
          onErrorSpottingDraftChange={onErrorSpottingDraftChange}
          onClozeAnswersChange={onClozeAnswersChange}
        />
        </div>
      </TaskChrome>
    </div>
  );
}
