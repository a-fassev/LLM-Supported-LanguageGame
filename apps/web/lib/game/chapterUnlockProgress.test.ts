import { describe, expect, it } from "vitest";
import {
  allChapterQuestsEarnedMarks,
  isOptionalChapterQuestSlug,
  OPTIONAL_CHAPTER_QUEST_SLUGS,
  questsRequiredForChapterUnlock,
} from "@/lib/game/chapterUnlockProgress";

describe("chapterUnlockProgress", () => {
  it("treats configured bonus quest slugs as optional", () => {
    for (const slug of OPTIONAL_CHAPTER_QUEST_SLUGS) {
      expect(isOptionalChapterQuestSlug(slug)).toBe(true);
    }
    expect(isOptionalChapterQuestSlug("chapter-02-quest-03-school-project")).toBe(false);
    expect(isOptionalChapterQuestSlug("chapter-03-quest-06-bonus-extra")).toBe(false);
  });

  it("excludes optional quests from chapter unlock requirements", () => {
    const quests = [
      { id: "pre", slug: "chapter-01-quest-04-bonus-vocab" },
      { id: "a", slug: "chapter-02-quest-02-nutelleria" },
      { id: "b", slug: "chapter-02-quest-05-bonus-vocab" },
    ];
    expect(questsRequiredForChapterUnlock(quests)).toEqual([quests[1]]);
  });

  it("unlocks when all required quests are complete, ignoring bonus", () => {
    const quests = [
      { id: "q1", slug: "chapter-02-quest-02-nutelleria" },
      { id: "q2", slug: "chapter-02-quest-03-school-project" },
      { id: "bonus", slug: "chapter-02-quest-05-bonus-vocab" },
    ];
    const completed = new Set(["q1", "q2"]);
    expect(allChapterQuestsEarnedMarks(quests, completed)).toBe(true);
  });

  it("does not unlock when a required quest is missing", () => {
    const quests = [
      { id: "q1", slug: "chapter-02-quest-02-nutelleria" },
      { id: "q2", slug: "chapter-02-quest-03-school-project" },
      { id: "bonus", slug: "chapter-02-quest-05-bonus-vocab" },
    ];
    const completed = new Set(["q1"]);
    expect(allChapterQuestsEarnedMarks(quests, completed)).toBe(false);
  });
});
