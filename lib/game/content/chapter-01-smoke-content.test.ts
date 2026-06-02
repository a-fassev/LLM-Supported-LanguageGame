import { afterEach, describe, expect, it } from "vitest";
import { findCatalogQuest, loadContentCatalog, resetContentCatalogCacheForTests } from "@/lib/game/content/catalog-loader";

describe("chapter-01 smoke content", () => {
  afterEach(() => {
    resetContentCatalogCacheForTests();
  });

  it("keeps quest-01 task scene compatible with placeholder multiple-choice attempts", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    expect(quest).toBeTruthy();
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-01-scene-02");
    expect(taskScene?.scene_type).toBe("task");
    expect(taskScene?.screen_type).toBe("multiple_choice");

    const questions = (taskScene?.content.task as { questions?: unknown[] } | undefined)?.questions ?? [];
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it("keeps quest-02 matching scene with at least one correct pair", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-02");
    expect(quest).toBeTruthy();
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-02-scene-02");
    expect(taskScene?.scene_type).toBe("task");
    expect(taskScene?.screen_type).toBe("matching");

    const correctPairs =
      (taskScene?.content.task as { correctPairs?: unknown[] } | undefined)?.correctPairs ?? [];
    expect(Array.isArray(correctPairs)).toBe(true);
    expect(correctPairs.length).toBeGreaterThan(0);
  });

});
