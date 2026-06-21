export type ChapterReleaseWave = {
  /** ISO 8601 with fixed offset (Europe/Berlin summer time for pilot dates). */
  releasesAt: string;
  chapterIds: readonly string[];
};

export const CHAPTER_RELEASE_TIMEZONE = "Europe/Berlin";

export const PILOT_CHAPTER_RELEASE_WAVES: readonly ChapterReleaseWave[] = [
  { releasesAt: "2026-06-29T08:30:00+02:00", chapterIds: ["chapter-01", "chapter-02"] },
  { releasesAt: "2026-06-30T09:30:00+02:00", chapterIds: ["chapter-03", "chapter-04"] },
  { releasesAt: "2026-07-02T09:30:00+02:00", chapterIds: ["chapter-05", "chapter-06"] },
];

const releaseAtByChapterId = buildReleaseAtIndex(PILOT_CHAPTER_RELEASE_WAVES);

function buildReleaseAtIndex(
  waves: readonly ChapterReleaseWave[],
): ReadonlyMap<string, number> {
  const index = new Map<string, number>();
  for (const wave of waves) {
    const releaseMs = Date.parse(wave.releasesAt);
    if (Number.isNaN(releaseMs)) {
      throw new Error(`Invalid chapter release timestamp: ${wave.releasesAt}`);
    }
    for (const chapterId of wave.chapterIds) {
      const existing = index.get(chapterId);
      if (existing !== undefined && existing !== releaseMs) {
        throw new Error(`Duplicate chapter release schedule for ${chapterId}`);
      }
      index.set(chapterId, releaseMs);
    }
  }
  return index;
}

/** `null` when the chapter is not on the pilot schedule (always released). */
export function getChapterReleaseAt(chapterId: string): Date | null {
  const releaseMs = releaseAtByChapterId.get(chapterId);
  if (releaseMs === undefined) return null;
  return new Date(releaseMs);
}

export function isChapterReleaseScheduleEnforced(): boolean {
  return process.env.NODE_ENV !== "development";
}

export function isChapterReleasedBySchedule(chapterId: string, now: Date = new Date()): boolean {
  const releaseAt = getChapterReleaseAt(chapterId);
  if (!releaseAt) return true;
  return now.getTime() >= releaseAt.getTime();
}

export function isChapterScheduleLocked(chapterId: string, now: Date = new Date()): boolean {
  if (!isChapterReleaseScheduleEnforced()) return false;
  return !isChapterReleasedBySchedule(chapterId, now);
}

export function getChapterUnlocksAtIso(chapterId: string, now: Date = new Date()): string | null {
  if (!isChapterReleaseScheduleEnforced()) return null;
  const releaseAt = getChapterReleaseAt(chapterId);
  if (!releaseAt) return null;
  if (now.getTime() >= releaseAt.getTime()) return null;
  return releaseAt.toISOString();
}

export function isChapterScheduleLockedForBootstrap(
  chapterId: string,
  now: Date = new Date(),
): boolean {
  return isChapterScheduleLocked(chapterId, now);
}

const RELEASE_LABEL_LOCALE = "it-IT";

export function formatChapterReleaseLabel(releaseAt: Date, locale = RELEASE_LABEL_LOCALE): string {
  const datePart = releaseAt.toLocaleDateString(locale, {
    timeZone: CHAPTER_RELEASE_TIMEZONE,
    day: "numeric",
    month: "long",
  });
  const timePart = releaseAt.toLocaleTimeString(locale, {
    timeZone: CHAPTER_RELEASE_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart}, ore ${timePart}`;
}

export function chapterNotReleasedMessage(chapterId: string, now: Date = new Date()): string {
  const releaseAt = getChapterReleaseAt(chapterId);
  if (!releaseAt || now.getTime() >= releaseAt.getTime()) {
    return "Questo capitolo non e ancora disponibile.";
  }
  return `Questo capitolo si apre il ${formatChapterReleaseLabel(releaseAt)}.`;
}

export function chapterNotReleasedMessageFromUnlocksAt(unlocksAtIso: string): string {
  const releaseAt = new Date(unlocksAtIso);
  if (Number.isNaN(releaseAt.getTime())) {
    return "Questo capitolo non e ancora disponibile.";
  }
  return `Questo capitolo si apre il ${formatChapterReleaseLabel(releaseAt)}.`;
}
