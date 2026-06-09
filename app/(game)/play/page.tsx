"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  advanceRun,
  attemptRun,
  retreatRun,
  getRunSnapshot,
  startRun,
  type ApiErrorResult,
  type AttemptRunDto,
  type RunDto,
  type RunSceneDto,
  type RunSnapshotDto,
  type TaskOutcomeDto,
  type TaskReviewDto,
  readTaskReview,
} from "@/lib/api-client";
import { gameClientMessages } from "@/lib/game/clientMessages";
import { useGameSession } from "@/lib/game/session-context";
import { readNonEmptyString } from "@/lib/game/read-non-empty-string";
import { readTaskSceneTitle } from "@/lib/game/scene-display";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { buildMcAttempt } from "@/lib/game/tasks/multiple-choice/build-mc-attempt";
import { buildMatchingAttempt } from "@/lib/game/tasks/matching/build-matching-attempt";
import {
  createEmptyMcSelections,
  MC_CONTENT_MISMATCH_MESSAGE,
  normalizeMcContentResult,
} from "@/lib/game/tasks/multiple-choice/normalize-mc-content";
import {
  createEmptyMatchingPairs,
  MATCHING_CONTENT_MISMATCH_MESSAGE,
  normalizeMatchingContentResult,
} from "@/lib/game/tasks/matching/normalize-matching-content";
import { validateMatchingDraft } from "@/lib/game/tasks/matching/validate-matching-draft";
import { buildDragDropAttempt } from "@/lib/game/tasks/drag-drop/build-drag-drop-attempt";
import { createEmptyDragDropAssignments } from "@/lib/game/tasks/drag-drop/drag-drop-assignment-actions";
import {
  DRAG_DROP_CONTENT_MISMATCH_MESSAGE,
  normalizeDragDropContentResult,
} from "@/lib/game/tasks/drag-drop/normalize-drag-drop-content";
import { validateDragDropDraft } from "@/lib/game/tasks/drag-drop/validate-drag-drop-draft";
import { buildFreitextAttempt } from "@/lib/game/tasks/freitext/build-freitext-attempt";
import {
  FREITEXT_CONTENT_MISMATCH_MESSAGE,
  normalizeFreitextContentResult,
} from "@/lib/game/tasks/freitext/normalize-freitext-content";
import { validateFreitextDraft } from "@/lib/game/tasks/freitext/validate-freitext-draft";
import { buildErrorSpottingAttempt } from "@/lib/game/tasks/error-spotting/build-error-spotting-attempt";
import {
  createEmptyErrorSpottingDraft,
  ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE,
  normalizeErrorSpottingContentResult,
} from "@/lib/game/tasks/error-spotting/normalize-error-spotting-content";
import { validateErrorSpottingDraft } from "@/lib/game/tasks/error-spotting/validate-error-spotting-draft";
import type { ErrorSpottingDraft } from "@/lib/game/tasks/error-spotting/error-spotting-types";
import { buildClozeAttempt } from "@/lib/game/tasks/cloze/build-cloze-attempt";
import { countClozeGaps, createEmptyClozeAnswers } from "@/lib/game/tasks/cloze/cloze-gap-order";
import {
  CLOZE_CONTENT_MISMATCH_MESSAGE,
  normalizeClozeContentResult,
} from "@/lib/game/tasks/cloze/normalize-cloze-content";
import { validateClozeDraft } from "@/lib/game/tasks/cloze/validate-cloze-draft";
import type { ClozeAnswersDraft } from "@/lib/game/tasks/cloze/cloze-types";
import { readTaskSceneInstruction } from "@/lib/game/scene-display";
import type { MatchingPairsDraft } from "@/lib/game/tasks/matching/matching-types";
import type { DragDropAssignmentsDraft } from "@/lib/game/tasks/drag-drop/drag-drop-types";
import { clampMcQuestionIndex } from "@/lib/game/tasks/multiple-choice/mc-question-nav";
import { validateMcSelections } from "@/lib/game/tasks/multiple-choice/validate-mc-selections";
import type { McSelectionsDraft } from "@/lib/game/tasks/multiple-choice/mc-types";
import { useMountedRef } from "@/lib/game/use-mounted-ref";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";
import { GameBackground } from "@/components/game/layout/GameBackground";
import { QuestShell } from "@/components/game/shell/QuestShell";
import { SceneRouter } from "@/components/game/shell/SceneRouter";
import { PauseOverlay } from "@/components/game/overlays/PauseOverlay";
import { SuccessOverlay } from "@/components/game/overlays/SuccessOverlay";
import { ReferenceDocumentOverlay } from "@/components/game/overlays/ReferenceDocumentOverlay";
import {
  toReferenceDocumentView,
  type ReferenceDocumentView,
} from "@/lib/game/reference-document-view";
import {
  isGameFinaleCompletedRun,
  QUEST_COMPLETE_GAME_FINALE,
} from "@/lib/game/game-finale";

type RunState = {
  totalSlices: number;
  backpackProgressPercent: number;
  run: RunDto | null;
};

function mergeRunState(_current: RunState, data: RunSnapshotDto): RunState {
  return {
    totalSlices: data.totalSlices,
    backpackProgressPercent: data.backpackProgressPercent,
    run: data.run,
  };
}

const QUEST_COMPLETE_STANDARD: TaskOutcomeDto = {
  kind: "success",
  ratio: 1,
  awardedSlices: 0,
  awardedBackpackPieces: 0,
  headline: "Missione completata!",
  body: "Ottimo lavoro. Scegli la prossima missione dalla lista.",
};

function mergeAttemptState(_current: RunState, data: AttemptRunDto): RunState {
  return {
    totalSlices: data.totalSlices,
    backpackProgressPercent: data.backpackProgressPercent,
    run: data.run,
  };
}

function readTaskOutcome(error: ApiErrorResult): TaskOutcomeDto | null {
  const raw = error.details?.taskOutcome as TaskOutcomeDto | undefined;
  return raw ?? null;
}

function activeRunConflictMessage(error: ApiErrorResult): string {
  const existingChapterId = readNonEmptyString(error.details?.existingChapterId);
  const existingQuestId = readNonEmptyString(error.details?.existingQuestId);
  if (!existingChapterId || !existingQuestId) {
    return error.error;
  }
  return `${error.error} Missione attiva: ${existingChapterId} / ${existingQuestId}.`;
}

function syncMcDraftForScene(
  scene: RunSceneDto | null,
  setters: {
    setMcSelections: (value: McSelectionsDraft | null) => void;
    setMcQuestionIndex: (value: number) => void;
    setMcValidationError: (value: string | null) => void;
  },
) {
  if (!scene || scene.scene_type !== "task" || scene.screen_type !== "multiple_choice") {
    setters.setMcSelections(null);
    setters.setMcQuestionIndex(0);
    setters.setMcValidationError(null);
    return;
  }
  const normalized = normalizeMcContentResult(getTaskPayload(scene));
  if (!normalized.ok) {
    setters.setMcSelections(null);
    setters.setMcQuestionIndex(0);
    setters.setMcValidationError(MC_CONTENT_MISMATCH_MESSAGE);
    return;
  }
  setters.setMcSelections(createEmptyMcSelections(normalized.content.questions.length));
  setters.setMcQuestionIndex(0);
  setters.setMcValidationError(null);
}

function syncDragDropDraftForScene(
  scene: RunSceneDto | null,
  setters: {
    setDragDropAssignments: (value: DragDropAssignmentsDraft | null) => void;
    setDragDropValidationError: (value: string | null) => void;
  },
) {
  if (!scene || scene.scene_type !== "task" || scene.screen_type !== "drag_drop") {
    setters.setDragDropAssignments(null);
    setters.setDragDropValidationError(null);
    return;
  }
  const normalized = normalizeDragDropContentResult(getTaskPayload(scene));
  if (!normalized.ok) {
    setters.setDragDropAssignments(null);
    setters.setDragDropValidationError(DRAG_DROP_CONTENT_MISMATCH_MESSAGE);
    return;
  }
  setters.setDragDropAssignments(
    createEmptyDragDropAssignments(normalized.content.targets.map((target) => target.id)),
  );
  setters.setDragDropValidationError(null);
}

function syncFreetextDraftForScene(
  scene: RunSceneDto | null,
  setters: {
    setFreetextAnswer: (value: string) => void;
    setFreetextValidationError: (value: string | null) => void;
  },
) {
  if (!scene || scene.scene_type !== "task" || scene.screen_type !== "free_text") {
    setters.setFreetextAnswer("");
    setters.setFreetextValidationError(null);
    return;
  }
  const normalized = normalizeFreitextContentResult(
    getTaskPayload(scene),
    readTaskSceneInstruction(scene),
    scene.content.referenceDocument,
  );
  if (!normalized.ok) {
    setters.setFreetextAnswer("");
    setters.setFreetextValidationError(FREITEXT_CONTENT_MISMATCH_MESSAGE);
    return;
  }
  setters.setFreetextAnswer("");
  setters.setFreetextValidationError(null);
}

function syncMatchingDraftForScene(
  scene: RunSceneDto | null,
  setters: {
    setMatchingPairs: (value: MatchingPairsDraft | null) => void;
    setMatchingValidationError: (value: string | null) => void;
  },
) {
  if (!scene || scene.scene_type !== "task" || scene.screen_type !== "matching") {
    setters.setMatchingPairs(null);
    setters.setMatchingValidationError(null);
    return;
  }
  const normalized = normalizeMatchingContentResult(getTaskPayload(scene));
  if (!normalized.ok) {
    setters.setMatchingPairs(null);
    setters.setMatchingValidationError(MATCHING_CONTENT_MISMATCH_MESSAGE);
    return;
  }
  setters.setMatchingPairs(createEmptyMatchingPairs(normalized.content.leftItems.map((item) => item.id)));
  setters.setMatchingValidationError(null);
}

function syncErrorSpottingDraftForScene(
  scene: RunSceneDto | null,
  setters: {
    setErrorSpottingDraft: (value: ErrorSpottingDraft | null) => void;
    setErrorSpottingValidationError: (value: string | null) => void;
  },
) {
  if (!scene || scene.scene_type !== "task" || scene.screen_type !== "error_spotting") {
    setters.setErrorSpottingDraft(null);
    setters.setErrorSpottingValidationError(null);
    return;
  }
  const normalized = normalizeErrorSpottingContentResult(getTaskPayload(scene));
  if (!normalized.ok) {
    setters.setErrorSpottingDraft(null);
    setters.setErrorSpottingValidationError(ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE);
    return;
  }
  setters.setErrorSpottingDraft(createEmptyErrorSpottingDraft());
  setters.setErrorSpottingValidationError(null);
}

type ClozeDraftPreserveContext = {
  sceneId: string;
  answers: ClozeAnswersDraft;
};

function clozePreserveForTransition(
  nextScene: RunSceneDto | null,
  previousSceneId: string | undefined,
  answers: ClozeAnswersDraft | null,
): ClozeDraftPreserveContext | null {
  if (
    !nextScene ||
    nextScene.scene_type !== "task" ||
    nextScene.screen_type !== "cloze" ||
    !previousSceneId ||
    nextScene.id !== previousSceneId ||
    !answers
  ) {
    return null;
  }
  return { sceneId: previousSceneId, answers };
}

function syncClozeDraftForScene(
  scene: RunSceneDto | null,
  setters: {
    setClozeAnswers: (value: ClozeAnswersDraft | null) => void;
    setClozeValidationError: (value: string | null) => void;
  },
  preserve: ClozeDraftPreserveContext | null,
) {
  if (!scene || scene.scene_type !== "task" || scene.screen_type !== "cloze") {
    setters.setClozeAnswers(null);
    setters.setClozeValidationError(null);
    return;
  }
  const normalized = normalizeClozeContentResult(getTaskPayload(scene));
  if (!normalized.ok) {
    setters.setClozeAnswers(null);
    setters.setClozeValidationError(CLOZE_CONTENT_MISMATCH_MESSAGE);
    return;
  }
  const gapCount = countClozeGaps(normalized.content.lines);
  if (preserve && preserve.sceneId === scene.id && preserve.answers.length === gapCount) {
    setters.setClozeAnswers([...preserve.answers]);
    setters.setClozeValidationError(null);
    return;
  }
  setters.setClozeAnswers(createEmptyClozeAnswers(gapCount));
  setters.setClozeValidationError(null);
}

function syncTaskDraftsForScene(
  scene: RunSceneDto | null,
  setters: {
    setMcSelections: (value: McSelectionsDraft | null) => void;
    setMcQuestionIndex: (value: number) => void;
    setMcValidationError: (value: string | null) => void;
    setMatchingPairs: (value: MatchingPairsDraft | null) => void;
    setMatchingValidationError: (value: string | null) => void;
    setDragDropAssignments: (value: DragDropAssignmentsDraft | null) => void;
    setDragDropValidationError: (value: string | null) => void;
    setFreetextAnswer: (value: string) => void;
    setFreetextValidationError: (value: string | null) => void;
    setErrorSpottingDraft: (value: ErrorSpottingDraft | null) => void;
    setErrorSpottingValidationError: (value: string | null) => void;
    setClozeAnswers: (value: ClozeAnswersDraft | null) => void;
    setClozeValidationError: (value: string | null) => void;
  },
  clozePreserve: ClozeDraftPreserveContext | null = null,
) {
  syncMcDraftForScene(scene, {
    setMcSelections: setters.setMcSelections,
    setMcQuestionIndex: setters.setMcQuestionIndex,
    setMcValidationError: setters.setMcValidationError,
  });
  syncMatchingDraftForScene(scene, {
    setMatchingPairs: setters.setMatchingPairs,
    setMatchingValidationError: setters.setMatchingValidationError,
  });
  syncDragDropDraftForScene(scene, {
    setDragDropAssignments: setters.setDragDropAssignments,
    setDragDropValidationError: setters.setDragDropValidationError,
  });
  syncFreetextDraftForScene(scene, {
    setFreetextAnswer: setters.setFreetextAnswer,
    setFreetextValidationError: setters.setFreetextValidationError,
  });
  syncErrorSpottingDraftForScene(scene, {
    setErrorSpottingDraft: setters.setErrorSpottingDraft,
    setErrorSpottingValidationError: setters.setErrorSpottingValidationError,
  });
  syncClozeDraftForScene(scene, {
    setClozeAnswers: setters.setClozeAnswers,
    setClozeValidationError: setters.setClozeValidationError,
  }, clozePreserve);
}

function readReference(scene: RunSceneDto | null): ReferenceDocumentView | null {
  if (!scene || scene.scene_type !== "task") return null;
  const task = getTaskPayload(scene);
  const ref = task.referenceDocument ?? scene.content.referenceDocument;
  return toReferenceDocumentView(ref);
}

export default function PlayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chapterId = searchParams.get("chapterId");
  const questId = searchParams.get("questId");

  const { token, clearSession } = useGameSession();
  const mountedRef = useMountedRef();
  const [state, setState] = useState<RunState>({ totalSlices: 0, backpackProgressPercent: 0, run: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mcSelections, setMcSelections] = useState<McSelectionsDraft | null>(null);
  const [mcQuestionIndex, setMcQuestionIndex] = useState(0);
  const [mcValidationError, setMcValidationError] = useState<string | null>(null);
  const [matchingPairs, setMatchingPairs] = useState<MatchingPairsDraft | null>(null);
  const [matchingValidationError, setMatchingValidationError] = useState<string | null>(null);
  const [dragDropAssignments, setDragDropAssignments] = useState<DragDropAssignmentsDraft | null>(null);
  const [dragDropValidationError, setDragDropValidationError] = useState<string | null>(null);
  const [freetextAnswer, setFreetextAnswer] = useState("");
  const [freetextValidationError, setFreetextValidationError] = useState<string | null>(null);
  const [errorSpottingDraft, setErrorSpottingDraft] = useState<ErrorSpottingDraft | null>(null);
  const [errorSpottingValidationError, setErrorSpottingValidationError] = useState<string | null>(null);
  const [clozeAnswers, setClozeAnswers] = useState<ClozeAnswersDraft | null>(null);
  const [clozeValidationError, setClozeValidationError] = useState<string | null>(null);
  const [sceneNavPending, setSceneNavPending] = useState(false);
  const [taskPending, setTaskPending] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [outcome, setOutcome] = useState<TaskOutcomeDto | null>(null);
  const [taskReview, setTaskReview] = useState<TaskReviewDto | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  /** Keeps task-success overlay on the completed scene background until dismissed. */
  const [backgroundHoldKey, setBackgroundHoldKey] = useState<string | null>(null);
  /** Keeps quest chrome on the completed task scene while the success overlay is open. */
  const [chromeHoldScene, setChromeHoldScene] = useState<RunSceneDto | null>(null);
  const pendingDraftSyncSceneRef = useRef<RunSceneDto | null>(null);

  const currentScene = state.run?.currentScene ?? null;
  const displayScene =
    successOpen && chromeHoldScene !== null ? chromeHoldScene : currentScene;
  const clampedMcQuestionIndex = useMemo(() => {
    const sceneForMc = displayScene ?? currentScene;
    if (!sceneForMc || sceneForMc.screen_type !== "multiple_choice") return mcQuestionIndex;
    return clampMcQuestionIndex(sceneForMc, mcQuestionIndex);
  }, [currentScene, displayScene, mcQuestionIndex]);
  const referenceDocument = useMemo(() => readReference(displayScene), [displayScene]);
  const taskHeaderTitle = useMemo(() => {
    if (!displayScene || displayScene.scene_type !== "task") return null;
    return readTaskSceneTitle(displayScene);
  }, [displayScene]);
  const canRetreat =
    state.run?.canRetreat === true &&
    (currentScene?.sceneNumber ?? 1) > 1 &&
    !successOpen;

  const backgroundPreloadKeys = useMemo(() => {
    const next = state.run?.nextSceneBackground;
    return next ? ([next] as const) : undefined;
  }, [state.run?.nextSceneBackground]);

  const visibleBackgroundKey =
    successOpen && backgroundHoldKey !== null
      ? backgroundHoldKey
      : (currentScene?.background ?? null);

  const dismissSuccessOverlay = useCallback(() => {
    const pending = pendingDraftSyncSceneRef.current;
    if (pending) {
      syncTaskDraftsForScene(pending, {
        setMcSelections,
        setMcQuestionIndex,
        setMcValidationError,
        setMatchingPairs,
        setMatchingValidationError,
        setDragDropAssignments,
        setDragDropValidationError,
        setFreetextAnswer,
        setFreetextValidationError,
        setErrorSpottingDraft,
        setErrorSpottingValidationError,
        setClozeAnswers,
        setClozeValidationError,
      });
      pendingDraftSyncSceneRef.current = null;
    }
    setSuccessOpen(false);
    setOutcome(null);
    setTaskReview(null);
    setShowSolution(false);
    setBackgroundHoldKey(null);
    setChromeHoldScene(null);
  }, []);

  const chapterPathForRun = useCallback(
    (run: RunDto | null) => (run?.chapterId ? `/chapters/${run.chapterId}` : "/chapters"),
    [],
  );

  const finishQuestToChapterHub = useCallback(
    (run: RunDto) => {
      dismissSuccessOverlay();
      router.push(chapterPathForRun(run));
    },
    [chapterPathForRun, dismissSuccessOverlay, router],
  );

  const finishCompletedRun = useCallback(
    (run: RunDto) => {
      if (isGameFinaleCompletedRun(run)) {
        dismissSuccessOverlay();
        router.push("/menu");
        return;
      }
      finishQuestToChapterHub(run);
    },
    [dismissSuccessOverlay, finishQuestToChapterHub, router],
  );

  const postAttemptContinueLabel = useMemo(() => {
    if (!state.run || state.run.status !== "completed") return undefined;
    return isGameFinaleCompletedRun(state.run) ? "Torna al menu" : "Alla lista missioni";
  }, [state.run]);

  const handlePostAttemptContinue = useCallback(() => {
    if (state.run?.status === "completed" && state.run) {
      finishCompletedRun(state.run);
      return;
    }
    dismissSuccessOverlay();
  }, [dismissSuccessOverlay, finishCompletedRun, state.run]);

  const handleCompletedRun = useCallback(
    (
      run: RunDto,
      ctx?: {
        taskOutcome?: TaskOutcomeDto | null;
        holdScene?: RunSceneDto | null;
        backgroundKey?: string | null;
      },
    ) => {
      if (ctx?.taskOutcome) {
        setBackgroundHoldKey(ctx.backgroundKey ?? null);
        setChromeHoldScene(ctx.holdScene ?? null);
        setOutcome(ctx.taskOutcome);
        setSuccessOpen(true);
        return;
      }
      if (ctx?.holdScene) {
        setBackgroundHoldKey(ctx.backgroundKey ?? null);
        setChromeHoldScene(ctx.holdScene);
      }
      setOutcome(
        isGameFinaleCompletedRun(run) ? QUEST_COMPLETE_GAME_FINALE : QUEST_COMPLETE_STANDARD,
      );
      setSuccessOpen(true);
    },
    [],
  );

  const loadRun = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    pendingDraftSyncSceneRef.current = null;
    setSuccessOpen(false);
    setOutcome(null);
    setTaskReview(null);
    setShowSolution(false);
    setBackgroundHoldKey(null);
    setChromeHoldScene(null);

    const result = chapterId && questId ? await startRun(token, { chapterId, questId }) : await getRunSnapshot(token);
    if (!mountedRef.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        clearSession();
        router.replace("/login");
        setLoading(false);
        return;
      }
      if (result.code === "quest_already_completed" && chapterId) {
        toastBlockingApiError(result);
        router.replace(`/chapters/${chapterId}`);
        setLoading(false);
        return;
      }
      if (result.code === "active_run_exists") {
        const snapshot = await getRunSnapshot(token);
        if (!mountedRef.current) return;
        if (snapshot.ok && snapshot.data.run) {
          setState((current) => mergeRunState(current, snapshot.data));
          syncTaskDraftsForScene(snapshot.data.run?.currentScene ?? null, {
            setMcSelections,
            setMcQuestionIndex,
            setMcValidationError,
            setMatchingPairs,
            setMatchingValidationError,
            setDragDropAssignments,
            setDragDropValidationError,
            setFreetextAnswer,
            setFreetextValidationError,
            setErrorSpottingDraft,
            setErrorSpottingValidationError,
            setClozeAnswers,
            setClozeValidationError,
          });
          setError(activeRunConflictMessage(result));
          toastBlockingApiError(result);
          setLoading(false);
          return;
        }
      }
      toastBlockingApiError(result);
      setError(result.error);
      setLoading(false);
      return;
    }

    setState((current) => mergeRunState(current, result.data));
    syncTaskDraftsForScene(result.data.run?.currentScene ?? null, {
      setMcSelections,
      setMcQuestionIndex,
      setMcValidationError,
      setMatchingPairs,
      setMatchingValidationError,
      setDragDropAssignments,
      setDragDropValidationError,
      setFreetextAnswer,
      setFreetextValidationError,
      setErrorSpottingDraft,
      setErrorSpottingValidationError,
      setClozeAnswers,
      setClozeValidationError,
    });
    const run = result.data.run;
    if (run?.status === "completed") {
      handleCompletedRun(run);
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [chapterId, clearSession, handleCompletedRun, mountedRef, questId, router, token]);

  useEffect(() => {
    void (async () => {
      await loadRun();
      if (!mountedRef.current) return;
    })();
  }, [loadRun, mountedRef]);

  async function onAdvanceStory() {
    if (!token || !state.run || !currentScene) return;
    setSceneNavPending(true);
    const sceneBeforeAdvance = currentScene;
    const backgroundBeforeAdvance = currentScene.background ?? null;
    const result = await advanceRun(token, state.run.runId, { sceneId: currentScene.id });
    if (!mountedRef.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      toastBlockingApiError(result);
      setError(result.error);
      setSceneNavPending(false);
      return;
    }
    const nextScene = result.data.run?.currentScene ?? null;
    setState((current) => mergeRunState(current, result.data));
    syncTaskDraftsForScene(
      nextScene,
      {
        setMcSelections,
        setMcQuestionIndex,
        setMcValidationError,
        setMatchingPairs,
        setMatchingValidationError,
        setDragDropAssignments,
        setDragDropValidationError,
        setFreetextAnswer,
        setFreetextValidationError,
        setErrorSpottingDraft,
        setErrorSpottingValidationError,
        setClozeAnswers,
        setClozeValidationError,
      },
      clozePreserveForTransition(nextScene, currentScene.id, clozeAnswers),
    );
    setMcValidationError(null);
    setMatchingValidationError(null);
    setDragDropValidationError(null);
    if (result.data.run?.status === "completed") {
      handleCompletedRun(result.data.run, {
        holdScene: sceneBeforeAdvance,
        backgroundKey: backgroundBeforeAdvance,
      });
    }
    setSceneNavPending(false);
  }

  async function onRetreatScene() {
    if (!token || !state.run || !currentScene || !canRetreat) return;
    setSceneNavPending(true);
    setError(null);
    const result = await retreatRun(token, state.run.runId, { sceneId: currentScene.id });
    if (!mountedRef.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      toastBlockingApiError(result);
      setError(result.error);
      setSceneNavPending(false);
      return;
    }
    const nextScene = result.data.run?.currentScene ?? null;
    setState((current) => mergeRunState(current, result.data));
    syncTaskDraftsForScene(
      nextScene,
      {
        setMcSelections,
        setMcQuestionIndex,
        setMcValidationError,
        setMatchingPairs,
        setMatchingValidationError,
        setDragDropAssignments,
        setDragDropValidationError,
        setFreetextAnswer,
        setFreetextValidationError,
        setErrorSpottingDraft,
        setErrorSpottingValidationError,
        setClozeAnswers,
        setClozeValidationError,
      },
      clozePreserveForTransition(nextScene, currentScene.id, clozeAnswers),
    );
    setMcValidationError(null);
    setMatchingValidationError(null);
    setDragDropValidationError(null);
    setFreetextValidationError(null);
    setErrorSpottingValidationError(null);
    setClozeValidationError(null);
    setSceneNavPending(false);
  }

  async function onSubmitTask() {
    if (!token || !state.run || !currentScene || currentScene.scene_type !== "task") return;
    if (successOpen || showSolution) return;
    setTaskPending(true);
    setError(null);
    const backgroundBeforeSubmit = currentScene.background;
    const sceneBeforeSubmit = currentScene;

    let attempt: unknown;
    if (currentScene.screen_type === "multiple_choice") {
      const normalized = normalizeMcContentResult(getTaskPayload(currentScene));
      if (!normalized.ok) {
        setMcValidationError(MC_CONTENT_MISMATCH_MESSAGE);
        setTaskPending(false);
        return;
      }
      const selections = mcSelections ?? createEmptyMcSelections(normalized.content.questions.length);
      const validation = validateMcSelections(normalized.content, selections);
      if (!validation.ok) {
        setMcValidationError(validation.message);
        setMcQuestionIndex(validation.firstUnansweredIndex);
        setTaskPending(false);
        return;
      }
      setMcValidationError(null);
      attempt = buildMcAttempt(selections);
    } else if (currentScene.screen_type === "matching") {
      const normalized = normalizeMatchingContentResult(getTaskPayload(currentScene));
      if (!normalized.ok) {
        setMatchingValidationError(MATCHING_CONTENT_MISMATCH_MESSAGE);
        setTaskPending(false);
        return;
      }
      const leftIds = normalized.content.leftItems.map((item) => item.id);
      const draft = matchingPairs ?? createEmptyMatchingPairs(leftIds);
      const validation = validateMatchingDraft(leftIds, draft);
      if (!validation.ok) {
        setMatchingValidationError(validation.message);
        setTaskPending(false);
        return;
      }
      setMatchingValidationError(null);
      attempt = buildMatchingAttempt(leftIds, draft);
    } else if (currentScene.screen_type === "drag_drop") {
      const normalized = normalizeDragDropContentResult(getTaskPayload(currentScene));
      if (!normalized.ok) {
        setDragDropValidationError(DRAG_DROP_CONTENT_MISMATCH_MESSAGE);
        setTaskPending(false);
        return;
      }
      const targetIds = normalized.content.targets.map((target) => target.id);
      const draft = dragDropAssignments ?? createEmptyDragDropAssignments(targetIds);
      const validation = validateDragDropDraft(normalized.content, draft);
      if (!validation.ok) {
        setDragDropValidationError(validation.message);
        setTaskPending(false);
        return;
      }
      setDragDropValidationError(null);
      attempt = buildDragDropAttempt(normalized.content.targets, draft);
    } else if (currentScene.screen_type === "error_spotting") {
      const normalized = normalizeErrorSpottingContentResult(getTaskPayload(currentScene));
      if (!normalized.ok) {
        setErrorSpottingValidationError(ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE);
        setTaskPending(false);
        return;
      }
      const draft = errorSpottingDraft ?? createEmptyErrorSpottingDraft();
      const validation = validateErrorSpottingDraft(draft);
      if (!validation.ok) {
        setErrorSpottingValidationError(validation.message);
        setTaskPending(false);
        return;
      }
      setErrorSpottingValidationError(null);
      attempt = buildErrorSpottingAttempt(draft);
    } else if (currentScene.screen_type === "cloze") {
      const normalized = normalizeClozeContentResult(getTaskPayload(currentScene));
      if (!normalized.ok) {
        setClozeValidationError(CLOZE_CONTENT_MISMATCH_MESSAGE);
        setTaskPending(false);
        return;
      }
      const gapCount = countClozeGaps(normalized.content.lines);
      const draft = clozeAnswers ?? createEmptyClozeAnswers(gapCount);
      const validation = validateClozeDraft(draft, gapCount);
      if (!validation.ok) {
        setClozeValidationError(validation.message);
        setTaskPending(false);
        return;
      }
      setClozeValidationError(null);
      attempt = buildClozeAttempt(draft);
    } else if (currentScene.screen_type === "free_text") {
      const normalized = normalizeFreitextContentResult(
        getTaskPayload(currentScene),
        readTaskSceneInstruction(currentScene),
        currentScene.content.referenceDocument,
      );
      if (!normalized.ok) {
        setFreetextValidationError(FREITEXT_CONTENT_MISMATCH_MESSAGE);
        setTaskPending(false);
        return;
      }
      const validation = validateFreitextDraft(normalized.content, freetextAnswer);
      if (!validation.ok) {
        setFreetextValidationError(validation.message);
        setTaskPending(false);
        return;
      }
      setFreetextValidationError(null);
      attempt = buildFreitextAttempt(freetextAnswer.trim());
    } else {
      setError(gameClientMessages.taskEvaluationNotImplemented);
      setTaskPending(false);
      return;
    }
    const result = await attemptRun(token, state.run.runId, { sceneId: currentScene.id, attempt });
    if (!mountedRef.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      const taskOutcome = readTaskOutcome(result);
      if (taskOutcome) {
        setOutcome(taskOutcome);
        setTaskReview(readTaskReview(result));
        setShowSolution(false);
        setSuccessOpen(true);
      } else {
        toastBlockingApiError(result);
        setError(result.error);
      }
      setTaskPending(false);
      return;
    }

    const nextScene = result.data.run?.currentScene ?? null;
    setState((current) => mergeAttemptState(current, result.data));
    if (result.data.taskOutcome) {
      pendingDraftSyncSceneRef.current = nextScene;
      setBackgroundHoldKey(backgroundBeforeSubmit);
      setChromeHoldScene(sceneBeforeSubmit);
      setOutcome(result.data.taskOutcome);
      setTaskReview(result.data.taskReview ?? null);
      setShowSolution(false);
      setSuccessOpen(true);
    } else {
      syncTaskDraftsForScene(
        nextScene,
        {
          setMcSelections,
          setMcQuestionIndex,
          setMcValidationError,
          setMatchingPairs,
          setMatchingValidationError,
          setDragDropAssignments,
          setDragDropValidationError,
          setFreetextAnswer,
          setFreetextValidationError,
          setErrorSpottingDraft,
          setErrorSpottingValidationError,
          setClozeAnswers,
          setClozeValidationError,
        },
        clozePreserveForTransition(nextScene, currentScene.id, clozeAnswers),
      );
    }
    setMcValidationError(null);
    setMatchingValidationError(null);
    setDragDropValidationError(null);
    setFreetextValidationError(null);
    setErrorSpottingValidationError(null);
    setClozeValidationError(null);
    setTaskPending(false);
  }

  return (
    <GameBackground
      assetKey={visibleBackgroundKey}
      preloadAssetKeys={backgroundPreloadKeys}
      mode="play"
    >
      {loading ? (
        <main className="flex min-h-dvh items-center justify-center">
          <p className="text-sm text-muted-foreground">Caricamento missione...</p>
        </main>
      ) : !currentScene || !state.run ? (
        <main className="game-shell-inset flex min-h-dvh items-center justify-center">
          <div className="game-panel game-panel-inset max-w-md space-y-3 text-center">
            <p className="text-sm">Nessuna missione attiva.</p>
            <Button onClick={() => router.push("/chapters")}>Vai ai capitoli</Button>
          </div>
        </main>
      ) : (
        <>
      <QuestShell
        headerTitle={taskHeaderTitle}
        showHud={displayScene?.scene_type === "task"}
        showDocument={Boolean(referenceDocument)}
        totalSlices={state.totalSlices}
        backpackProgressPercent={state.backpackProgressPercent}
        onOpenPause={() => setPauseOpen(true)}
        onOpenDocument={referenceDocument ? () => setDocumentOpen(true) : undefined}
        showContentPanel={displayScene?.scene_type === "task"}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        {error ? (
          <div className="w-full max-w-2xl shrink-0">
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <SceneRouter
          scene={displayScene ?? currentScene}
          mcSelections={mcSelections}
          mcQuestionIndex={clampedMcQuestionIndex}
          mcValidationError={mcValidationError}
          matchingPairs={matchingPairs}
          matchingValidationError={matchingValidationError}
          dragDropAssignments={dragDropAssignments}
          dragDropValidationError={dragDropValidationError}
          freetextAnswer={freetextAnswer}
          freetextValidationError={freetextValidationError}
          errorSpottingDraft={errorSpottingDraft}
          errorSpottingValidationError={errorSpottingValidationError}
          clozeAnswers={clozeAnswers}
          clozeValidationError={clozeValidationError}
          canRetreat={canRetreat}
          sceneNavPending={sceneNavPending}
          taskSubmitting={taskPending}
          reviewMode={
            showSolution &&
            taskReview !== null &&
            displayScene?.screen_type !== "free_text"
          }
          taskReview={
            displayScene?.screen_type === "free_text" ? null : taskReview
          }
          postAttemptOutcome={
            showSolution && displayScene?.screen_type !== "free_text" ? outcome : null
          }
          postAttemptContinueLabel={postAttemptContinueLabel}
          onPostAttemptContinue={handlePostAttemptContinue}
          onMcSelectionsChange={(next) => {
            setMcSelections(next);
            setMcValidationError(null);
          }}
          onMcQuestionIndexChange={(index) => {
            setMcQuestionIndex(index);
            setMcValidationError(null);
          }}
          onMatchingPairsChange={(next) => {
            setMatchingPairs((prev) => {
              if (prev === null) return typeof next === "function" ? prev : next;
              return typeof next === "function" ? next(prev) : next;
            });
            setMatchingValidationError(null);
          }}
          onDragDropAssignmentsChange={(next) => {
            setDragDropAssignments((prev) => {
              if (prev === null) return typeof next === "function" ? prev : next;
              return typeof next === "function" ? next(prev) : next;
            });
            setDragDropValidationError(null);
          }}
          onFreetextAnswerChange={(value) => {
            setFreetextAnswer(value);
            setFreetextValidationError(null);
          }}
          onErrorSpottingDraftChange={(draft) => {
            setErrorSpottingDraft(draft);
            setErrorSpottingValidationError(null);
          }}
          onClozeAnswersChange={(answers) => {
            setClozeAnswers(answers);
            setClozeValidationError(null);
          }}
          onAdvanceStory={onAdvanceStory}
          onRetreatScene={onRetreatScene}
          onSubmitTask={onSubmitTask}
        />
        </div>
      </QuestShell>

      <PauseOverlay
        open={pauseOpen}
        onOpenChange={setPauseOpen}
        onResume={() => setPauseOpen(false)}
        onBackToQuestList={() => router.push(`/chapters/${state.run?.chapterId ?? ""}`)}
        onBackToMenu={() => router.push("/menu")}
      />

      <SuccessOverlay
        open={successOpen && !showSolution}
        outcome={outcome}
        freetextReview={
          taskReview?.screenType === "free_text" ? taskReview : null
        }
        secondaryAction={
          taskReview &&
          displayScene?.scene_type === "task" &&
          displayScene.screen_type !== "free_text" &&
          !showSolution
            ? {
                label: "Mostra soluzione",
                onClick: () => {
                  if (
                    displayScene?.screen_type === "multiple_choice" &&
                    taskReview?.screenType === "multiple_choice" &&
                    taskReview.questions.length > 1
                  ) {
                    setMcQuestionIndex(0);
                  }
                  setShowSolution(true);
                },
              }
            : undefined
        }
        primaryLabel={
          state.run?.status === "completed"
            ? isGameFinaleCompletedRun(state.run)
              ? "Torna al menu"
              : "Alla lista missioni"
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            if (state.run?.status === "completed" && state.run) {
              finishCompletedRun(state.run);
              return;
            }
            dismissSuccessOverlay();
          }
        }}
        showRewardSummary={
          outcome !== null && (outcome.awardedSlices > 0 || outcome.awardedBackpackPieces > 0)
        }
        onContinue={() => {
          if (state.run?.status === "completed" && state.run) {
            finishCompletedRun(state.run);
            return;
          }
          dismissSuccessOverlay();
        }}
      />

      {referenceDocument ? (
        <ReferenceDocumentOverlay
          open={documentOpen}
          onOpenChange={setDocumentOpen}
          title={referenceDocument.title}
          body={referenceDocument.body}
          sections={referenceDocument.sections}
          figures={referenceDocument.figures}
        />
      ) : null}
        </>
      )}
    </GameBackground>
  );
}
