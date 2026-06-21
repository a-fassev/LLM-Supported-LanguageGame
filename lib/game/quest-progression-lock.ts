import {
  findCatalogQuest,
  type ContentCatalog,
} from "@/lib/game/content/catalog-loader";
import { getPreviousProgressionChapter } from "@/lib/game/chapter-progression";
import { toQuestProgressId } from "@/lib/game/quest-progress-id";
import { isChapterScheduleLocked } from "@/lib/game/chapter-release-schedule";

export function isChapterManuallyLocked(catalog: ContentCatalog, chapterId: string): boolean {
  const chapter = catalog.chapters?.find((item) => item.id === chapterId);
  return chapter?.locked === true;
}

export type ChapterAccessBlockReason = "manual" | "schedule" | null;

export function getChapterAccessBlockReason(
  catalog: ContentCatalog,
  chapterId: string,
  now: Date = new Date(),
): ChapterAccessBlockReason {
  if (isChapterManuallyLocked(catalog, chapterId)) return "manual";
  if (isChapterScheduleLocked(chapterId, now)) return "schedule";
  return null;
}

export function isChapterAccessBlocked(
  catalog: ContentCatalog,
  chapterId: string,
  now: Date = new Date(),
): boolean {
  return getChapterAccessBlockReason(catalog, chapterId, now) !== null;
}

export function isQuestProgressionLockedForAccount(
  catalog: ContentCatalog,
  chapterId: string,
  questId: string,
  completedQuestIds: Set<string>,
): boolean {
  const chapters = catalog.chapters ?? [];
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  if (chapterIndex < 0) return true;
  const previousChapter = getPreviousProgressionChapter(chapters, chapterId);
  if (previousChapter) {
    const requiredMainQuestProgressIds = previousChapter.questsExpanded
      .filter((quest) => quest.kind !== "bonus")
      .map((quest) => toQuestProgressId(previousChapter.id, quest.id));
    const previousChapterComplete = requiredMainQuestProgressIds.every((requiredQuestProgressId) =>
      completedQuestIds.has(requiredQuestProgressId),
    );
    if (!previousChapterComplete) return true;
  }

  const quest = findCatalogQuest(catalog, chapterId, questId);
  if (!quest) return true;
  if (
    quest.requiresQuestId &&
    !completedQuestIds.has(toQuestProgressId(chapterId, quest.requiresQuestId))
  ) {
    return true;
  }
  return false;
}

export function isQuestLockedForAccount(
  catalog: ContentCatalog,
  chapterId: string,
  questId: string,
  completedQuestIds: Set<string>,
): boolean {
  if (isChapterAccessBlocked(catalog, chapterId)) return true;
  return isQuestProgressionLockedForAccount(catalog, chapterId, questId, completedQuestIds);
}
