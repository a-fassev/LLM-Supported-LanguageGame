import type { RunSceneDto } from "@/lib/api-client";
import { StoryPanel } from "@/components/game/shell/StoryPanel";
import { TaskChrome } from "@/components/game/shell/TaskChrome";
import { TaskPanel } from "@/components/game/tasks/TaskPanel";
import { Button } from "@/components/ui/button";

type SceneRouterProps = {
  scene: RunSceneDto;
  attemptText: string;
  storySubmitting: boolean;
  taskSubmitting: boolean;
  onAttemptTextChange: (value: string) => void;
  onAdvanceStory: () => void;
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
    readString(content.instructions) ??
    readString((content.task as { instructions?: unknown } | undefined)?.instructions) ??
    undefined
  );
}

export function SceneRouter({
  scene,
  attemptText,
  storySubmitting,
  taskSubmitting,
  onAttemptTextChange,
  onAdvanceStory,
  onSubmitTask,
}: SceneRouterProps) {
  if (scene.scene_type === "story") {
    const variant = scene.screen_type === "dialogue" ? "dialog" : "interaction";
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4">
        <StoryPanel variant={variant} text={storyText(scene)} />
        <div className="game-shell-bottom-nav">
          <span />
          <Button onClick={onAdvanceStory} disabled={storySubmitting}>
            {storySubmitting ? "Avanzamento..." : "Avanti"}
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
      onPrimary={onSubmitTask}
    >
      <TaskPanel scene={scene} attemptText={attemptText} onAttemptTextChange={onAttemptTextChange} />
    </TaskChrome>
  );
}
