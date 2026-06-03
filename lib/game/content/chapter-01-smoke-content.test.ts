import { afterEach, describe, expect, it } from "vitest";
import { findCatalogQuest, loadContentCatalog, resetContentCatalogCacheForTests } from "@/lib/game/content/catalog-loader";

describe("chapter-01 smoke content", () => {
  afterEach(() => {
    resetContentCatalogCacheForTests();
  });

  it("keeps quest-01 story preview scenes before the MC fixtures", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    expect(quest?.scenes.map((scene) => scene.screen_type)).toEqual([
      "info",
      "info",
      "info",
      "multiple_choice",
      "multiple_choice",
    ]);
  });

  it("keeps quest-01 scene 04 as minimal flat multiple-choice", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-01-scene-04");
    expect(taskScene?.scene_type).toBe("task");
    expect(taskScene?.screen_type).toBe("multiple_choice");

    const task = taskScene?.content.task as { options?: unknown[]; questions?: unknown[] } | undefined;
    expect(Array.isArray(task?.options)).toBe(true);
    expect((task?.options ?? []).length).toBeGreaterThanOrEqual(2);
    expect(task?.questions).toBeUndefined();
  });

  it("keeps quest-01 scene 05 as rich multiple-choice with questions[]", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-01-scene-05");
    expect(taskScene?.scene_type).toBe("task");
    expect(taskScene?.screen_type).toBe("multiple_choice");

    const questions =
      (taskScene?.content.task as { questions?: { selectionMode?: string; options?: unknown[] }[] } | undefined)
        ?.questions ?? [];
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions.some((q) => q.selectionMode === "single")).toBe(true);
    expect(questions.some((q) => q.selectionMode === "multi")).toBe(true);
    const manyOptionsQuestion = questions.find((q) => (q.options ?? []).length >= 12);
    expect(manyOptionsQuestion).toBeTruthy();
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
