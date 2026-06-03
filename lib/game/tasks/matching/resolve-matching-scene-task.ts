import type { CatalogScene } from "@/lib/game/content/catalog-loader";
import {
  getSceneMaterialization,
  insertSceneMaterializationIfAbsent,
} from "@/lib/game/repositories/game-progress-repository";
import {
  materializeMatchingPool,
  matchingTaskHasConcreteItems,
  matchingTaskHasPoolAuthoring,
  type MatchingPoolPair,
} from "@/lib/game/tasks/matching/materialize-matching-pool";

function normalizePoolPairs(raw: unknown): MatchingPoolPair[] | null {
  if (!Array.isArray(raw)) return null;
  const out: MatchingPoolPair[] = [];
  const ids = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const row = entry as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const leftLabel = typeof row.leftLabel === "string" ? row.leftLabel.trim() : "";
    const rightLabel = typeof row.rightLabel === "string" ? row.rightLabel.trim() : "";
    if (!id || !leftLabel || !rightLabel || ids.has(id)) continue;
    ids.add(id);
    out.push({ id, leftLabel, rightLabel });
  }
  return out.length > 0 ? out : null;
}

export async function resolveMatchingSceneTaskForRun(
  runId: string,
  scene: CatalogScene,
): Promise<Record<string, unknown> | null> {
  if (scene.scene_type !== "task" || scene.screen_type !== "matching") {
    return null;
  }

  const catalogTask = scene.content.task;
  if (matchingTaskHasConcreteItems(catalogTask)) {
    return catalogTask;
  }

  if (!matchingTaskHasPoolAuthoring(catalogTask)) {
    return catalogTask;
  }

  const existing = await getSceneMaterialization(runId, scene.id);
  if (existing) return existing;

  const poolPairs = normalizePoolPairs(catalogTask.poolPairs);
  if (!poolPairs) return null;

  const sampleSize = typeof catalogTask.sampleSize === "number" ? catalogTask.sampleSize : 0;
  const presentation =
    catalogTask.presentation && typeof catalogTask.presentation === "object" && !Array.isArray(catalogTask.presentation)
      ? (catalogTask.presentation as {
          leftLabel?: string;
          rightLabel?: string;
          shuffleRightOrder?: boolean;
        })
      : undefined;

  let materialized: Record<string, unknown>;
  try {
    materialized = materializeMatchingPool({
      poolPairs,
      sampleSize,
      prompt: typeof catalogTask.prompt === "string" ? catalogTask.prompt : undefined,
      subtitle: typeof catalogTask.subtitle === "string" ? catalogTask.subtitle : undefined,
      presentation,
    }) as unknown as Record<string, unknown>;
  } catch {
    return null;
  }

  const inserted = await insertSceneMaterializationIfAbsent(runId, scene.id, materialized);
  if (inserted) return materialized;

  const raced = await getSceneMaterialization(runId, scene.id);
  return raced ?? materialized;
}

export async function resolveCatalogSceneForRun(
  runId: string,
  scene: CatalogScene,
): Promise<CatalogScene | null> {
  if (scene.scene_type !== "task" || scene.screen_type !== "matching") {
    return scene;
  }

  const task = await resolveMatchingSceneTaskForRun(runId, scene);
  if (!task) return null;

  return {
    ...scene,
    content: {
      ...scene.content,
      task,
    },
  };
}
