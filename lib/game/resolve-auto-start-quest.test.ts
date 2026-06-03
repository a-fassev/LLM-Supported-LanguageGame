import { describe, expect, it } from "vitest";
import { resolveAutoStartQuest } from "@/lib/game/resolve-auto-start-quest";
import type { ContentCatalog } from "@/lib/game/content/catalog-loader";
import type { QuestRunRow } from "@/lib/game/repositories/game-progress-repository";

function catalogFixture(): ContentCatalog {
  return {
    chapters: [
      {
        id: "chapter-01",
        title: "Capitolo 1",
        order: 1,
        quests: ["quest-01", "quest-02", "quest-01-bonus"],
        questsExpanded: [
          {
            id: "quest-01",
            title: "Q1",
            order: 1,
            kind: "main",
            requiresQuestId: null,
            autoStartQuestId: null,
            scenes: [],
          },
          {
            id: "quest-02",
            title: "Q2",
            order: 2,
            kind: "main",
            requiresQuestId: "quest-01",
            autoStartQuestId: "quest-01-bonus",
            scenes: [],
          },
          {
            id: "quest-01-bonus",
            title: "Bonus",
            order: 3,
            kind: "bonus",
            requiresQuestId: "quest-02",
            autoStartQuestId: null,
            scenes: [],
          },
        ],
      },
    ],
  };
}

function completedRun(): QuestRunRow {
  return {
    runId: "run-1",
    accountId: "acc-1",
    chapterId: "chapter-01",
    questId: "quest-02",
    currentSceneId: "chapter-01-quest-02-scene-02",
    status: "completed",
  };
}

describe("resolveAutoStartQuest", () => {
  it("offers bonus when main quest completed and bonus not done", () => {
    const result = resolveAutoStartQuest(catalogFixture(), completedRun(), ["chapter-01:quest-01", "chapter-01:quest-02"]);
    expect(result).toEqual({ chapterId: "chapter-01", questId: "quest-01-bonus" });
  });

  it("returns null when bonus already completed", () => {
    const result = resolveAutoStartQuest(catalogFixture(), completedRun(), [
      "chapter-01:quest-01",
      "chapter-01:quest-02",
      "chapter-01:quest-01-bonus",
    ]);
    expect(result).toBeNull();
  });

  it("returns null when run is still in progress", () => {
    const result = resolveAutoStartQuest(catalogFixture(), { ...completedRun(), status: "in_progress" }, []);
    expect(result).toBeNull();
  });
});
