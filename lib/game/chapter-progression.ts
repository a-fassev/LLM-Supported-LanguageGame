/** Chapter shape used for hub unlock and server start gates. */
export type ProgressionChapter = {
  id: string;
  reference?: boolean;
};

/**
 * Previous chapter in the progression chain, skipping reference (sandbox) chapters.
 */
export function getPreviousProgressionChapter<T extends ProgressionChapter>(
  orderedChapters: T[],
  chapterId: string,
): T | null {
  const chapterIndex = orderedChapters.findIndex((item) => item.id === chapterId);
  if (chapterIndex <= 0) return null;
  for (let i = chapterIndex - 1; i >= 0; i--) {
    const candidate = orderedChapters[i];
    if (!candidate.reference) return candidate;
  }
  return null;
}

export function isReferenceChapter(chapter: ProgressionChapter): boolean {
  return chapter.reference === true;
}
