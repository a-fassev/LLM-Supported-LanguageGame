export type ChapterUnlockQuest = {
  id: string;
  slug: string;
};

/**
 * Bonus vocab quests are playable but do not gate the next chapter.
 * Add every new `*-bonus-vocab` quest slug here when seeding a chapter.
 */
export const OPTIONAL_CHAPTER_QUEST_SLUGS = new Set<string>([
  "chapter-01-quest-04-bonus-vocab",
  "chapter-02-quest-05-bonus-vocab",
  "chapter-03-quest-05-bonus-vocab",
]);

export function isOptionalChapterQuestSlug(slug: string): boolean {
  return OPTIONAL_CHAPTER_QUEST_SLUGS.has(slug);
}

export function questsRequiredForChapterUnlock<T extends { slug: string }>(
  chapterQuests: T[],
): T[] {
  return chapterQuests.filter((q) => !isOptionalChapterQuestSlug(q.slug));
}

export function allChapterQuestsEarnedMarks(
  chapterQuests: ChapterUnlockQuest[],
  completedQuestIds: Set<string>,
): boolean {
  const required = questsRequiredForChapterUnlock(chapterQuests);
  if (required.length === 0) return true;
  return required.every((q) => completedQuestIds.has(q.id));
}
