import type { ContentCatalog } from "@/lib/game/content/catalog-loader";

/** Learner chapters that count toward backpack completion (chapter-01 … chapter-06). */
export const BACKPACK_PROGRESS_CHAPTER_IDS = [
  "chapter-01",
  "chapter-02",
  "chapter-03",
  "chapter-04",
  "chapter-05",
  "chapter-06",
] as const;

export type BackpackProgressDto = {
  backpackProgressPercent: number;
  backpackCompletedTasks: number;
  backpackTotalTasks: number;
};

export function countBackpackProgressTasks(catalog: ContentCatalog): number {
  let total = 0;
  for (const chapter of catalog.chapters) {
    if (!BACKPACK_PROGRESS_CHAPTER_IDS.includes(chapter.id as (typeof BACKPACK_PROGRESS_CHAPTER_IDS)[number])) {
      continue;
    }
    for (const quest of chapter.questsExpanded) {
      for (const scene of quest.scenes ?? []) {
        if (scene.scene_type === "task") {
          total += 1;
        }
      }
    }
  }
  return total;
}

export function deriveBackpackProgress(
  completedTaskPieces: number,
  totalTasks: number,
): BackpackProgressDto {
  const completed = Math.max(0, Math.trunc(completedTaskPieces));
  const total = Math.max(0, Math.trunc(totalTasks));
  if (total === 0) {
    return {
      backpackProgressPercent: 0,
      backpackCompletedTasks: completed,
      backpackTotalTasks: 0,
    };
  }
  const percent = Math.round((completed / total) * 100);
  return {
    backpackProgressPercent: Math.min(100, Math.max(0, percent)),
    backpackCompletedTasks: Math.min(completed, total),
    backpackTotalTasks: total,
  };
}

export function backpackProgressFromCatalog(
  catalog: ContentCatalog,
  completedTaskPieces: number,
): BackpackProgressDto {
  return deriveBackpackProgress(completedTaskPieces, countBackpackProgressTasks(catalog));
}
