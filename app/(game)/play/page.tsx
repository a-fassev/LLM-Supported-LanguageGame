"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  advanceRun,
  attemptRun,
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
import { toastBlockingApiError } from "@/lib/game/toast-from-api";
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

function firstString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

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
        const optionId = firstString(firstOption?.id);
        return optionId ? [optionId] : [];
      });
      return { taskType: "MultipleChoice", multipleChoice: { selections } };
    }
    const firstOption = Array.isArray(task.options)
      ? (task.options as Record<string, unknown>[]).find((item) => typeof item.id === "string")
      : undefined;
    const optionId = firstString(firstOption?.id);
    return { taskType: "MultipleChoice", multipleChoice: { selections: [optionId ? [optionId] : []] } };
  }

  if (scene.screen_type === "drag_drop") {
    const assignments: Record<string, string | string[]> = {};
    const targets = Array.isArray(task.targets) ? (task.targets as Record<string, unknown>[]) : [];
    const firstItem = Array.isArray(task.items)
      ? (task.items as Record<string, unknown>[]).find((item) => typeof item.id === "string")
      : undefined;
    const fallbackItemId = firstString(firstItem?.id);
    for (const target of targets) {
      const targetId = firstString(target.id);
      if (!targetId || !fallbackItemId) continue;
      assignments[targetId] = fallbackItemId;
    }
    return { taskType: "DragDrop", dragDrop: { assignments } };
  }

  if (scene.screen_type === "matching") {
    const pairs: Record<string, string> = {};
    const leftItems = Array.isArray(task.leftItems) ? (task.leftItems as Record<string, unknown>[]) : [];
    const rightItems = Array.isArray(task.rightItems) ? (task.rightItems as Record<string, unknown>[]) : [];
    const fallbackRightId = firstString(rightItems[0]?.id);
    if (fallbackRightId) {
      for (const left of leftItems) {
        const leftId = firstString(left.id);
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
  const existingChapterId = firstString(error.details?.existingChapterId);
  const existingQuestId = firstString(error.details?.existingQuestId);
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
  const body = firstString(ref.body);
  if (!body) return null;
  const title = firstString(ref.title) ?? "Documento";
  return { title, body };
}

export default function PlayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chapterId = searchParams.get("chapterId");
  const questId = searchParams.get("questId");

  const { token, clearSession } = useGameSession();
  const mountedRef = useRef(true);
  const [state, setState] = useState<RunState>({ totalSlices: 0, totalBackpackPieces: 0, run: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptText, setAttemptText] = useState("");
  const [storyPending, setStoryPending] = useState(false);
  const [taskPending, setTaskPending] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [outcome, setOutcome] = useState<TaskOutcomeDto | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const currentScene = state.run?.currentScene ?? null;
  const referenceDocument = useMemo(() => readReference(currentScene), [currentScene]);

  const loadRun = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const result = chapterId && questId ? await startRun(token, { chapterId, questId }) : await getRunSnapshot(token);
    if (!mountedRef.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        clearSession();
        router.replace("/login");
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
  }, [chapterId, clearSession, questId, router, token]);

  useEffect(() => {
    void (async () => {
      await loadRun();
      if (!mountedRef.current) return;
      setAttemptText("");
    })();
  }, [loadRun]);

  async function onAdvanceStory() {
    if (!token || !state.run || !currentScene) return;
    setStoryPending(true);
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
      setStoryPending(false);
      return;
    }
    setState((current) => mergeRunState(current, result.data));
    setAttemptText("");
    setStoryPending(false);
  }

  async function onSubmitTask() {
    if (!token || !state.run || !currentScene || currentScene.scene_type !== "task") return;
    setTaskPending(true);
    setError(null);

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
      setOutcome(result.data.taskOutcome);
      setSuccessOpen(true);
    }
    setTaskPending(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Caricamento missione...</p>
      </main>
    );
  }

  if (!currentScene || !state.run) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <div className="game-panel max-w-md space-y-3 p-4 text-center">
          <p className="text-sm">Nessuna missione attiva.</p>
          <Button onClick={() => router.push("/chapters")}>Vai ai capitoli</Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <QuestShell
        backgroundKey={currentScene.background}
        showHud={currentScene.scene_type === "task"}
        showDocument={Boolean(referenceDocument)}
        totalSlices={state.totalSlices}
        totalBackpackPieces={state.totalBackpackPieces}
        onOpenPause={() => setPauseOpen(true)}
        onOpenDocument={referenceDocument ? () => setDocumentOpen(true) : undefined}
      >
        {error ? (
          <div className="mx-auto mt-18 w-full max-w-2xl px-4">
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <SceneRouter
          scene={currentScene}
          attemptText={attemptText}
          storySubmitting={storyPending}
          taskSubmitting={taskPending}
          onAttemptTextChange={setAttemptText}
          onAdvanceStory={onAdvanceStory}
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
        onOpenChange={setSuccessOpen}
        onContinue={() => {
          const chapterPath = state.run?.chapterId ? `/chapters/${state.run.chapterId}` : "/chapters";
          if (state.run?.status === "completed") {
            setSuccessOpen(false);
            setOutcome(null);
            router.push(chapterPath);
            return;
          }
          setSuccessOpen(false);
          setOutcome(null);
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
  );
}
