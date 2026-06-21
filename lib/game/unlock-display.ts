import type { BootstrapChapterDto, BootstrapQuestDto } from "@/lib/api-client";
import { getPreviousProgressionChapter, isReferenceChapter } from "@/lib/game/chapter-progression";
import {
  formatChapterReleaseLabel,
  getChapterReleaseAt,
} from "@/lib/game/chapter-release-schedule";
import { toQuestProgressId } from "@/lib/game/quest-progress-id";

export type ChapterLockReason = "manual" | "schedule" | "progression" | null;

function requiredQuestIds(chapter: BootstrapChapterDto): string[] {
  return chapter.quests.filter((quest) => quest.kind !== "bonus").map((quest) => quest.id);
}

function areAllRequiredDone(chapter: BootstrapChapterDto, completedQuestIds: Set<string>): boolean {
  const required = requiredQuestIds(chapter);
  if (required.length === 0) return true;
  return required.every((questId) => completedQuestIds.has(toQuestProgressId(chapter.id, questId)));
}

export function getChapterLockReason(
  chapter: BootstrapChapterDto,
  orderedChapters: BootstrapChapterDto[],
  completedQuestIds: Set<string>,
): ChapterLockReason {
  if (chapter.locked) return "manual";
  if (chapter.scheduleLocked) return "schedule";
  if (isReferenceChapter(chapter)) return null;
  const previousChapter = getPreviousProgressionChapter(orderedChapters, chapter.id);
  if (!previousChapter) return null;
  if (!areAllRequiredDone(previousChapter, completedQuestIds)) return "progression";
  return null;
}

export function isChapterLocked(
  chapter: BootstrapChapterDto,
  orderedChapters: BootstrapChapterDto[],
  completedQuestIds: Set<string>,
): boolean {
  return getChapterLockReason(chapter, orderedChapters, completedQuestIds) !== null;
}

export function getChapterScheduleLockLabel(chapter: BootstrapChapterDto): string | null {
  if (!chapter.scheduleLocked) return null;
  if (chapter.unlocksAt) {
    return formatChapterReleaseLabel(new Date(chapter.unlocksAt));
  }
  const releaseAt = getChapterReleaseAt(chapter.id);
  if (!releaseAt) return "Presto disponibile";
  return formatChapterReleaseLabel(releaseAt);
}

/** All main quests in the chapter are completed (bonus may still be open). */
export function isChapterMainProgressComplete(
  chapter: BootstrapChapterDto,
  completedQuestIds: Set<string>,
): boolean {
  return areAllRequiredDone(chapter, completedQuestIds);
}

/** Every quest in the chapter (main + bonus) is completed — nothing left to play. */
export function isChapterFullyComplete(
  chapter: BootstrapChapterDto,
  completedQuestIds: Set<string>,
): boolean {
  if (chapter.quests.length === 0) return false;
  return chapter.quests.every((quest) =>
    completedQuestIds.has(toQuestProgressId(chapter.id, quest.id)),
  );
}

export function isQuestLocked(
  chapterId: string,
  quest: BootstrapQuestDto,
  completedQuestIds: Set<string>,
): boolean {
  if (!quest.requiresQuestId) return false;
  return !completedQuestIds.has(toQuestProgressId(chapterId, quest.requiresQuestId));
}

export function isQuestCompleted(
  chapterId: string,
  quest: BootstrapQuestDto,
  completedQuestIds: Set<string>,
): boolean {
  return completedQuestIds.has(toQuestProgressId(chapterId, quest.id));
}
