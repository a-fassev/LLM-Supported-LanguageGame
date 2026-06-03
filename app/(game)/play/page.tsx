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

function getTaskPayload(scene: RunSceneDto): Record<string, unknown> {
  const task = (scene.content.task as Record<string, unknown> | undefined) ?? null;
  if (task && typeof task === "object") return task;
  return scene.content;
}

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

  if (scene.screen_type === "multiple_choice") {
    const questions = Array.isArray(task.questions) ? (task.questions as Record<string, unknown>[]) : null;
    if (questions && questions.length > 0) {
      const selections = questions.map((question) => {
        const firstOption = Array.isArray(question.options)
          ? (question.options as Record<string, unknown>[]).find((item) => typeof item.id === "string")
          : undefined;
        const optionId = readNonEmptyString(firstOption?.id);
        return optionId ? [optionId] : [];
      });
      return { taskType: "MultipleChoice", multipleChoice: { selections } };
    }
    const firstOption = Array.isArray(task.options)
      ? (task.options as Record<string, unknown>[]).find((item) => typeof item.id === "string")
      : undefined;
    const optionId = readNonEmptyString(firstOption?.id);
    return { taskType: "MultipleChoice", multipleChoice: { selections: [optionId ? [optionId] : []] } };
  }

  if (scene.screen_type === "drag_drop") {
    const assignments: Record<string, string | string[]> = {};
    const targets = Array.isArray(task.targets) ? (task.targets as Record<string, unknown>[]) : [];
    const firstItem = Array.isArray(task.items)
      ? (task.items as Record<string, unknown>[]).find((item) => typeof item.id === "string")
      : undefined;
    const fallbackItemId = readNonEmptyString(firstItem?.id);
    for (const target of targets) {
      const targetId = readNonEmptyString(target.id);
      if (!targetId || !fallbackItemId) continue;
      assignments[targetId] = fallbackItemId;
    }
    return { taskType: "DragDrop", dragDrop: { assignments } };
  }

  if (scene.screen_type === "matching") {
    const pairs: Record<string, string> = {};
    const leftItems = Array.isArray(task.leftItems) ? (task.leftItems as Record<string, unknown>[]) : [];
    const rightItems = Array.isArray(task.rightItems) ? (task.rightItems as Record<string, unknown>[]) : [];
    const fallbackRightId = readNonEmptyString(rightItems[0]?.id);
    if (fallbackRightId) {
      for (const left of leftItems) {
        const leftId = readNonEmptyString(left.id);
        if (!leftId) continue;
        pairs[leftId] = fallbackRightId;
      }
    }
    return { taskType: "Matching", matching: { pairs } };
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
    setLoading(false);
  }, [chapterId, clearSession, mountedRef, questId, router, token]);

  useEffect(() => {
    void (async () => {
      await loadRun();
      if (!mountedRef.current) return;
      setAttemptText("");
    })();
  }, [loadRun, mountedRef]);

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
    setAttemptText("");
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
    setAttemptText("");
    setSceneNavPending(false);
  }

  async function onSubmitTask() {
    if (!token || !state.run || !currentScene || currentScene.scene_type !== "task") return;
    setTaskPending(true);
    setError(null);
    const backgroundBeforeSubmit = currentScene.background;

    const attempt = buildPlaceholderAttempt(currentScene, attemptText);
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
    setAttemptText("");
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
        {error ? (
          <div className="w-full max-w-2xl">
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <SceneRouter
          scene={currentScene}
          attemptText={attemptText}
          canRetreat={canRetreat}
          sceneNavPending={sceneNavPending}
          taskSubmitting={taskPending}
          onAttemptTextChange={setAttemptText}
          onAdvanceStory={onAdvanceStory}
          onRetreatScene={onRetreatScene}
          onSubmitTask={onSubmitTask}
        />
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
