import { describe, expect, it } from "vitest";
import {
  getChapterLockReason,
  getChapterScheduleLockLabel,
  isChapterFullyComplete,
  isChapterLocked,
  isChapterMainProgressComplete,
  isQuestCompleted,
  isQuestLocked,
} from "@/lib/game/unlock-display";

const chapterScheduleFields = {
  unlocksAt: null,
  scheduleLocked: false,
  background: "chapters/00/chapter/bg",
  reference: false,
  gameFinale: false,
};

const chapter00 = {
  id: "chapter-00",
  title: "La valigia — Prima del viaggio",
  order: 0,
  locked: false,
  ...chapterScheduleFields,
  quests: [{ id: "quest-01", title: "Come si gioca", order: 1, kind: "main" as const, requiresQuestId: null, background: "bg" }],
};

const chapter01 = {
  id: "chapter-01",
  title: "Bologna",
  order: 1,
  locked: false,
  ...chapterScheduleFields,
  quests: [
    { id: "quest-01", title: "Q1", order: 1, kind: "main" as const, requiresQuestId: null, background: "bg" },
    { id: "quest-02", title: "Q2", order: 2, kind: "main" as const, requiresQuestId: "quest-01", background: "bg" },
  ],
};

const chapter02 = {
  id: "chapter-02",
  title: "Firenze",
  order: 2,
  locked: false,
  ...chapterScheduleFields,
  quests: [
    { id: "quest-01", title: "Q1", order: 1, kind: "main" as const, requiresQuestId: null, background: "bg" },
  ],
};

describe("unlock-display", () => {
  const progressionOrder = [chapter00, chapter01, chapter02];

  it("locks chapter-01 until chapter-00 main quest is completed", () => {
    expect(isChapterLocked(chapter01, progressionOrder, new Set())).toBe(true);
    const tutorialDone = new Set<string>(["chapter-00:quest-01"]);
    expect(isChapterLocked(chapter01, progressionOrder, tutorialDone)).toBe(false);
  });

  it("locks chapter-02 until chapter-01 main quests are completed", () => {
    expect(isChapterLocked(chapter02, progressionOrder, new Set())).toBe(true);
    const completed = new Set<string>(["chapter-01:quest-01", "chapter-01:quest-02"]);
    expect(isChapterLocked(chapter02, progressionOrder, completed)).toBe(false);
  });

  it("keeps tutorial chapter unlocked for new players", () => {
    expect(isChapterLocked(chapter00, progressionOrder, new Set())).toBe(false);
  });

  it("keeps chapter locked when only similarly named quests from other chapters are completed", () => {
    const completed = new Set<string>(["chapter-02:quest-01"]);
    expect(isChapterLocked(chapter02, [chapter01, chapter02], completed)).toBe(true);
  });

  it("locks chapter when manually locked in content", () => {
    const completed = new Set<string>(["chapter-01:quest-01", "chapter-01:quest-02"]);
    const unlockedChapter02 = { ...chapter02, locked: false };
    const manuallyLockedChapter02 = { ...chapter02, locked: true };
    expect(isChapterLocked(unlockedChapter02, [chapter01, unlockedChapter02], completed)).toBe(
      false,
    );
    expect(isChapterLocked(manuallyLockedChapter02, [chapter01, manuallyLockedChapter02], completed)).toBe(
      true,
    );
  });

  it("checks quest lock/completion using chapter-qualified ids", () => {
    const completed = new Set<string>(["chapter-01:quest-01"]);
    expect(isQuestLocked("chapter-01", chapter01.quests[1], completed)).toBe(false);
    expect(isQuestCompleted("chapter-02", chapter02.quests[0], completed)).toBe(false);
  });

  it("detects chapter main vs full completion", () => {
    const chapterWithBonus = {
      ...chapter01,
      quests: [
        ...chapter01.quests,
        {
          id: "quest-bonus",
          title: "Bonus",
          order: 3,
          kind: "bonus" as const,
          requiresQuestId: "quest-02",
        },
      ],
    };
    const mainOnly = new Set<string>(["chapter-01:quest-01", "chapter-01:quest-02"]);
    expect(isChapterMainProgressComplete(chapterWithBonus, mainOnly)).toBe(true);
    expect(isChapterFullyComplete(chapterWithBonus, mainOnly)).toBe(false);
    const allDone = new Set([...mainOnly, "chapter-01:quest-bonus"]);
    expect(isChapterFullyComplete(chapterWithBonus, allDone)).toBe(true);
  });

  it("locks chapter when bootstrap reports scheduleLocked", () => {
    const scheduledChapter01 = {
      ...chapter01,
      scheduleLocked: true,
      unlocksAt: "2026-06-29T06:30:00.000Z",
    };
    const tutorialDone = new Set<string>(["chapter-00:quest-01"]);
    expect(getChapterLockReason(scheduledChapter01, progressionOrder, tutorialDone)).toBe("schedule");
    expect(isChapterLocked(scheduledChapter01, progressionOrder, tutorialDone)).toBe(true);
    expect(getChapterScheduleLockLabel(scheduledChapter01)).toMatch(/29 giugno, ore 08:30/);
  });

  it("prefers schedule lock over progression when bootstrap reports scheduleLocked", () => {
    const scheduledChapter01 = {
      ...chapter01,
      scheduleLocked: true,
      unlocksAt: "2026-06-29T06:30:00.000Z",
    };
    expect(getChapterLockReason(scheduledChapter01, progressionOrder, new Set())).toBe("schedule");
  });
});
