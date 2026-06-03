import { describe, expect, it } from "vitest";
import { isChapterLocked, isQuestCompleted, isQuestLocked } from "@/lib/game/unlock-display";

const chapter01 = {
  id: "chapter-01",
  title: "Bologna",
  order: 1,
  quests: [
    { id: "quest-01", title: "Q1", order: 1, kind: "main" as const, requiresQuestId: null, autoStartQuestId: null },
    { id: "quest-02", title: "Q2", order: 2, kind: "main" as const, requiresQuestId: "quest-01", autoStartQuestId: null },
  ],
};

const chapter02 = {
  id: "chapter-02",
  title: "Firenze",
  order: 2,
  quests: [
    { id: "quest-01", title: "Q1", order: 1, kind: "main" as const, requiresQuestId: null, autoStartQuestId: null },
  ],
};

describe("unlock-display", () => {
  it("keeps chapter locked when only similarly named quests from other chapters are completed", () => {
    const completed = new Set<string>(["chapter-02:quest-01"]);
    expect(isChapterLocked(chapter02, [chapter01, chapter02], completed)).toBe(true);
  });

  it("checks quest lock/completion using chapter-qualified ids", () => {
    const completed = new Set<string>(["chapter-01:quest-01"]);
    expect(isQuestLocked("chapter-01", chapter01.quests[1], completed)).toBe(false);
    expect(isQuestCompleted("chapter-02", chapter02.quests[0], completed)).toBe(false);
  });
});
