import { describe, expect, it } from "vitest";
import {
  isGameFinaleCatalogQuest,
  isGameFinaleCompletedRun,
  QUEST_COMPLETE_GAME_FINALE,
} from "@/lib/game/game-finale";

const catalog = {
  chapters: [
    {
      id: "chapter-05",
      gameFinale: false,
      quests: ["quest-01", "quest-01-bonus"],
    },
    {
      id: "chapter-06",
      gameFinale: true,
      quests: ["quest-01", "quest-02", "quest-03", "quest-04", "quest-01-bonus"],
    },
  ],
};

describe("game-finale", () => {
  it("flags only the last quest of a gameFinale chapter", () => {
    expect(isGameFinaleCatalogQuest(catalog, "chapter-06", "quest-04")).toBe(false);
    expect(isGameFinaleCatalogQuest(catalog, "chapter-06", "quest-01-bonus")).toBe(true);
    expect(isGameFinaleCatalogQuest(catalog, "chapter-05", "quest-01-bonus")).toBe(false);
    expect(isGameFinaleCatalogQuest(catalog, "chapter-99", "quest-01-bonus")).toBe(false);
  });

  it("detects completed game-finale runs via isGameFinaleQuest", () => {
    expect(
      isGameFinaleCompletedRun({
        status: "completed",
        chapterId: "chapter-06",
        questId: "quest-01-bonus",
        isGameFinaleQuest: true,
      }),
    ).toBe(true);
    expect(
      isGameFinaleCompletedRun({
        status: "completed",
        chapterId: "chapter-06",
        questId: "quest-04",
        isGameFinaleQuest: false,
      }),
    ).toBe(false);
    expect(
      isGameFinaleCompletedRun({
        status: "in_progress",
        chapterId: "chapter-06",
        questId: "quest-01-bonus",
        isGameFinaleQuest: true,
      }),
    ).toBe(false);
  });

  it("uses natural Italian in the finale overlay body", () => {
    expect(QUEST_COMPLETE_GAME_FINALE.body).toContain("tutte le sei lezioni");
    expect(QUEST_COMPLETE_GAME_FINALE.body).not.toMatch(/tutte e sei/);
  });
});
