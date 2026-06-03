import type { RunSceneDto } from "@/lib/api-client";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { readNonEmptyString } from "@/lib/game/read-non-empty-string";

const DEFAULT_TASK_CHROME_INSTRUCTION = "Completa l'attività e premi «Controlla».";

/** Scene- or task-level instruction shown above the exercise body. */
export function readTaskSceneInstruction(scene: RunSceneDto): string | undefined {
  const content = scene.content;
  return (
    readNonEmptyString(content.instruction) ??
    readNonEmptyString(content.instructions) ??
    readNonEmptyString((content.task as { instruction?: unknown } | undefined)?.instruction) ??
    readNonEmptyString((content.task as { instructions?: unknown } | undefined)?.instructions) ??
    undefined
  );
}

/** Task-level prompt in the task body (`content.task.prompt`); not used for MC `questions[]` items. */
export function readTaskScenePrompt(scene: RunSceneDto): string | undefined {
  return readNonEmptyString(getTaskPayload(scene).prompt) ?? undefined;
}

/** Instruction strip for `TaskChrome` (scene instruction only; per-question prompts stay in the task body). */
export function readTaskChromeInstructions(scene: RunSceneDto): string | undefined {
  const instruction = readTaskSceneInstruction(scene);
  if (instruction) return instruction;
  if (scene.screen_type === "multiple_choice") return undefined;
  return DEFAULT_TASK_CHROME_INSTRUCTION;
}

/** Task scene heading from `content.title` or nested `content.task.title`. */
export function readTaskSceneTitle(scene: RunSceneDto): string | null {
  const content = scene.content;
  return (
    readNonEmptyString(content.title) ??
    readNonEmptyString((content.task as { title?: unknown } | undefined)?.title) ??
    null
  );
}
