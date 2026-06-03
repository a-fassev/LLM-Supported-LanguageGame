import type { BootstrapChapterDto, BootstrapQuestDto } from "@/lib/api-client";
import { toQuestProgressId } from "@/lib/game/quest-progress-id";

function requiredQuestIds(chapter: BootstrapChapterDto): string[] {
  return chapter.quests.filter((quest) => quest.kind !== "bonus").map((quest) => quest.id);
}

function areAllRequiredDone(chapter: BootstrapChapterDto, completedQuestIds: Set<string>): boolean {
  const required = requiredQuestIds(chapter);
  if (required.length === 0) return true;
  return required.every((questId) => completedQuestIds.has(toQuestProgressId(chapter.id, questId)));
}

export function isChapterLocked(
  chapter: BootstrapChapterDto,
  orderedChapters: BootstrapChapterDto[],
  completedQuestIds: Set<string>,
): boolean {
  const chapterIndex = orderedChapters.findIndex((item) => item.id === chapter.id);
  if (chapterIndex <= 0) return false;
  const previousChapter = orderedChapters[chapterIndex - 1];
  return !areAllRequiredDone(previousChapter, completedQuestIds);
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
