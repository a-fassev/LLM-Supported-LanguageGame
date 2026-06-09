import { describe, expect, it } from "vitest";
import {
  loadContentCatalog,
  resetContentCatalogCacheForTests,
} from "@/lib/game/content/catalog-loader";

describe("chapter-01 Bologna catalog", () => {
  it("loads five quests with expected scene counts and bonus wiring", async () => {
    resetContentCatalogCacheForTests();
    const catalog = await loadContentCatalog({ bypassCache: true });
    const chapter = catalog.chapters.find((c) => c.id === "chapter-01");
    expect(chapter).toBeDefined();
    expect(chapter?.title).toBe("Benvenuti a Bologna");
    expect(chapter?.background).toBe("chapters/01/chapter/bg-missions");
    expect(chapter?.questsExpanded.map((q) => q.id)).toEqual([
      "quest-01",
      "quest-02",
      "quest-03",
      "quest-04",
      "quest-01-bonus",
    ]);

    const sceneCounts: Record<string, number> = {};
    for (const quest of chapter!.questsExpanded) {
      sceneCounts[quest.id] = quest.scenes.length;
      expect(quest.background.length).toBeGreaterThan(0);
    }

    expect(sceneCounts).toEqual({
      "quest-01": 7,
      "quest-02": 10,
      "quest-03": 6,
      "quest-04": 16,
      "quest-01-bonus": 4,
    });

    const bonus = chapter!.questsExpanded.find((q) => q.id === "quest-01-bonus");
    expect(bonus?.kind).toBe("bonus");
    expect(bonus?.requiresQuestId).toBe("quest-04");

    const bonusTask = bonus!.scenes.find(
      (s) => s.scene_type === "task" && s.screen_type === "matching",
    );
    expect(bonusTask?.content.task).toMatchObject({ sampleSize: 10 });
    const poolPairs = bonusTask?.content.task.poolPairs;
    expect(poolPairs?.length).toBeGreaterThanOrEqual(50);
  });
});
