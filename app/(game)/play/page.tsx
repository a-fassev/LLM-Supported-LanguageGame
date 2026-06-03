"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/lib/api-client";
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

type RunState = {
  totalSlices: number;
  totalBackpackPieces: number;
  run: RunDto | null;
};

function buildPlaceholderAttempt(scene: RunSceneDto, typedText: string): unknown {
  const task = getTaskPayload(scene);
  // IMPORTANT: never read authored "correct*" fields in client placeholders.
  if (scene.screen_type === "cloze") {
    const lines = Array.isArray(task.lines) ? (task.lines as Record<string, unknown>[]) : [];
    const answers: string[] = [];
    for (const line of lines) {
      const segments = Array.isArray(line.segments) ? (line.segments as Record<string, unknown>[]) : [];
      for (const segment of segments) {
        if (String(segment.kind ?? "").toLowerCase() !== "gap") continue;
        answers.push(typedText ?? "");
      }
    }
    return { taskType: "ClozeText", clozeText: { answers } };
  }

  if (scene.screen_type === "error_spotting") {
    return { taskType: "ErrorSpotting", errorSpotting: { selectedSegmentIds: [], corrections: {} } };
  }

  return { rawText: typedText };
}

function mergeRunState(_current: RunState, data: RunSnapshotDto): RunState {
  return {
    totalSlices: data.totalSlices,
    totalBackpackPieces: data.totalBackpackPieces,
    run: data.run,
  };
}

function mergeAttemptState(_current: RunState, data: AttemptRunDto): RunState {
  return {
    totalSlices: data.totalSlices,
    totalBackpackPieces: data.totalBackpackPieces,
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
  },
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
}

function readReference(scene: RunSceneDto | null): { title?: string; body: string } | null {
  if (!scene || scene.scene_type !== "task") return null;
  const task = getTaskPayload(scene);
  const ref = (task.referenceDocument ?? scene.content.referenceDocument) as Record<string, unknown> | undefined;
  if (!ref) return null;
  const body = readNonEmptyString(ref.body);
  if (!body) return null;
  const title = readNonEmptyString(ref.title) ?? "Documento";
  return { title, body };
}

export default function PlayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chapterId = searchParams.get("chapterId");
  const questId = searchParams.get("questId");

  const { token, clearSession } = useGameSession();
  const mountedRef = useMountedRef();
  const [state, setState] = useState<RunState>({ totalSlices: 0, totalBackpackPieces: 0, run: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptText, setAttemptText] = useState("");
  const [mcSelections, setMcSelections] = useState<McSelectionsDraft | null>(null);
  const [mcQuestionIndex, setMcQuestionIndex] = useState(0);
  const [mcValidationError, setMcValidationError] = useState<string | null>(null);
  const [matchingPairs, setMatchingPairs] = useState<MatchingPairsDraft | null>(null);
  const [matchingValidationError, setMatchingValidationError] = useState<string | null>(null);
  const [dragDropAssignments, setDragDropAssignments] = useState<DragDropAssignmentsDraft | null>(null);
  const [dragDropValidationError, setDragDropValidationError] = useState<string | null>(null);
  const [freetextAnswer, setFreetextAnswer] = useState("");
  const [freetextValidationError, setFreetextValidationError] = useState<string | null>(null);
  const [sceneNavPending, setSceneNavPending] = useState(false);
  const [taskPending, setTaskPending] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [outcome, setOutcome] = useState<TaskOutcomeDto | null>(null);
  /** Keeps task-success overlay on the completed scene background until dismissed. */
  const [backgroundHoldKey, setBackgroundHoldKey] = useState<string | null>(null);

  const currentScene = state.run?.currentScene ?? null;
  const referenceDocument = useMemo(() => readReference(currentScene), [currentScene]);
  const taskHeaderTitle = useMemo(() => {
    if (!currentScene || currentScene.scene_type !== "task") return null;
    return readTaskSceneTitle(currentScene);
  }, [currentScene]);
  const canRetreat =
    state.run?.canRetreat === true && (currentScene?.sceneNumber ?? 1) > 1;

  const backgroundPreloadKeys = useMemo(() => {
    const next = state.run?.nextSceneBackground;
    return next ? ([next] as const) : undefined;
  }, [state.run?.nextSceneBackground]);

  const visibleBackgroundKey =
    successOpen && backgroundHoldKey !== null
      ? backgroundHoldKey
      : (currentScene?.background ?? null);

  function dismissSuccessOverlay() {
    setSuccessOpen(false);
    setOutcome(null);
    setBackgroundHoldKey(null);
  }

  const loadRun = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const result = chapterId && questId ? await startRun(token, { chapterId, questId }) : await getRunSnapshot(token);
    if (!mountedRef.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        clearSession();
        router.replace("/login");
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
    });
    setLoading(false);
  }, [chapterId, clearSession, mountedRef, questId, router, token]);

  useEffect(() => {
    void (async () => {
      await loadRun();
      if (!mountedRef.current) return;
      setAttemptText("");
    })();
  }, [loadRun, mountedRef]);

  useEffect(() => {
    if (!currentScene || currentScene.screen_type !== "multiple_choice") return;
    const clamped = clampMcQuestionIndex(currentScene, mcQuestionIndex);
    if (clamped !== mcQuestionIndex) {
      setMcQuestionIndex(clamped);
    }
  }, [currentScene, mcQuestionIndex]);

  async function onAdvanceStory() {
    if (!token || !state.run || !currentScene) return;
    setSceneNavPending(true);
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
    });
    setAttemptText("");
    setMcValidationError(null);
    setMatchingValidationError(null);
    setDragDropValidationError(null);
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
    });
    setAttemptText("");
    setMcValidationError(null);
    setMatchingValidationError(null);
    setDragDropValidationError(null);
    setFreetextValidationError(null);
    setSceneNavPending(false);
  }

  async function onSubmitTask() {
    if (!token || !state.run || !currentScene || currentScene.scene_type !== "task") return;
    setTaskPending(true);
    setError(null);
    const backgroundBeforeSubmit = currentScene.background;

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
    } else if (currentScene.screen_type === "free_text") {
      const normalized = normalizeFreitextContentResult(
        getTaskPayload(currentScene),
        readTaskSceneInstruction(currentScene),
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
      attempt = buildPlaceholderAttempt(currentScene, attemptText);
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
        setSuccessOpen(true);
      } else {
        toastBlockingApiError(result);
        setError(result.error);
      }
      setTaskPending(false);
      return;
    }

    setState((current) => mergeAttemptState(current, result.data));
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
    });
    setAttemptText("");
    setMcValidationError(null);
    setMatchingValidationError(null);
    setDragDropValidationError(null);
    setFreetextValidationError(null);
    if (result.data.taskOutcome) {
      setBackgroundHoldKey(backgroundBeforeSubmit);
      setOutcome(result.data.taskOutcome);
      setSuccessOpen(true);
    }
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
        showHud={currentScene.scene_type === "task"}
        showDocument={Boolean(referenceDocument)}
        totalSlices={state.totalSlices}
        totalBackpackPieces={state.totalBackpackPieces}
        onOpenPause={() => setPauseOpen(true)}
        onOpenDocument={referenceDocument ? () => setDocumentOpen(true) : undefined}
        showContentPanel={currentScene.scene_type === "task"}
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
          scene={currentScene}
          mcSelections={mcSelections}
          mcQuestionIndex={mcQuestionIndex}
          mcValidationError={mcValidationError}
          matchingPairs={matchingPairs}
          matchingValidationError={matchingValidationError}
          dragDropAssignments={dragDropAssignments}
          dragDropValidationError={dragDropValidationError}
          freetextAnswer={freetextAnswer}
          freetextValidationError={freetextValidationError}
          canRetreat={canRetreat}
          sceneNavPending={sceneNavPending}
          taskSubmitting={taskPending}
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
        open={successOpen}
        outcome={outcome}
        onOpenChange={(open) => {
          if (!open) dismissSuccessOverlay();
        }}
        onContinue={() => {
          const chapterPath = state.run?.chapterId ? `/chapters/${state.run.chapterId}` : "/chapters";
          if (state.run?.status === "completed") {
            dismissSuccessOverlay();
            router.push(chapterPath);
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
        />
      ) : null}
        </>
      )}
    </GameBackground>
  );
}
