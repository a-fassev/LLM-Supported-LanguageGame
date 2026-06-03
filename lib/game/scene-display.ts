import type { RunSceneDto } from "@/lib/api-client";
import { readNonEmptyString } from "@/lib/game/read-non-empty-string";

/** Task scene heading from `content.title` or nested `content.task.title`. */
export function readTaskSceneTitle(scene: RunSceneDto): string | null {
  const content = scene.content;
  return (
    readNonEmptyString(content.title) ??
    readNonEmptyString((content.task as { title?: unknown } | undefined)?.title) ??
    null
  );
}
