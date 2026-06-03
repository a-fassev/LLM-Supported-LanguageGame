import type { RunSceneDto } from "@/lib/api-client";
import { StoryPanel } from "@/components/game/shell/StoryPanel";
import { TaskChrome } from "@/components/game/shell/TaskChrome";
import { TaskPanel } from "@/components/game/tasks/TaskPanel";
import { Button } from "@/components/ui/button";
type SceneRouterProps = {
  scene: RunSceneDto;
  attemptText: string;
  canRetreat: boolean;
  sceneNavPending: boolean;
  taskSubmitting: boolean;
  onAttemptTextChange: (value: string) => void;
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

function taskInstructions(scene: RunSceneDto): string | undefined {
  const content = scene.content;
  return (
    readString(content.instruction) ??
    readString(content.instructions) ??
    readString((content.task as { instruction?: unknown } | undefined)?.instruction) ??
    readString((content.task as { instructions?: unknown } | undefined)?.instructions) ??
    undefined
  );
}

export function SceneRouter({
  scene,
  attemptText,
  canRetreat,
  sceneNavPending,
  taskSubmitting,
  onAttemptTextChange,
  onAdvanceStory,
  onRetreatScene,
  onSubmitTask,
}: SceneRouterProps) {
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

  return (
    <TaskChrome
      instructions={taskInstructions(scene)}
      primaryLabel={taskSubmitting ? "Controllo..." : "Controlla"}
      primaryDisabled={taskSubmitting}
      canRetreat={canRetreat}
      retreatDisabled={!canRetreat || sceneNavPending || taskSubmitting}
      retreatLabel={sceneNavPending ? "..." : "Indietro"}
      onRetreat={onRetreatScene}
      onPrimary={onSubmitTask}
    >
      <TaskPanel attemptText={attemptText} onAttemptTextChange={onAttemptTextChange} />
    </TaskChrome>
  );
}
