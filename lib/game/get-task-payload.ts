import type { RunSceneDto } from "@/lib/api-client";

/** Task body from a run scene snapshot (`content.task` or legacy flat `content`). */
export function getTaskPayload(scene: RunSceneDto): Record<string, unknown> {
  const task = scene.content.task;
  if (task && typeof task === "object" && !Array.isArray(task)) {
    return task as Record<string, unknown>;
  }
  return scene.content as Record<string, unknown>;
}
