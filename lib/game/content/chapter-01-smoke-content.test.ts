import { afterEach, describe, expect, it } from "vitest";
import { findCatalogQuest, loadContentCatalog, resetContentCatalogCacheForTests } from "@/lib/game/content/catalog-loader";

describe("chapter-01 smoke content", () => {
  afterEach(() => {
    resetContentCatalogCacheForTests();
  });

  it("keeps quest-01 story preview scenes before MC and matching fixtures", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    expect(quest?.scenes.map((scene) => scene.screen_type)).toEqual([
      "info",
      "info",
      "info",
      "multiple_choice",
      "multiple_choice",
      "matching",
      "matching",
      "matching",
      "drag_drop",
      "drag_drop",
      "drag_drop",
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

  it("keeps quest-01 scene 06 as minimal matching fixture", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-01-scene-06");
    expect(taskScene?.scene_type).toBe("task");
    expect(taskScene?.screen_type).toBe("matching");

    const task = taskScene?.content.task as {
      leftItems?: unknown[];
      rightItems?: unknown[];
      correctPairs?: unknown[];
    };
    expect((task?.leftItems ?? []).length).toBe(3);
    expect((task?.rightItems ?? []).length).toBe(4);
    expect((task?.correctPairs ?? []).length).toBe(3);
  });

  it("keeps quest-01 scene 07 as medium matching fixture", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-01-scene-07");
    expect(taskScene?.screen_type).toBe("matching");

    const task = taskScene?.content.task as {
      leftItems?: unknown[];
      rightItems?: unknown[];
      correctPairs?: unknown[];
    };
    expect((task?.leftItems ?? []).length).toBe(6);
    expect((task?.rightItems ?? []).length).toBe(8);
    expect((task?.correctPairs ?? []).length).toBe(6);
  });

  it("keeps quest-01 scene 08 as rich matching fixture", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-01-scene-08");
    expect(taskScene?.screen_type).toBe("matching");
    expect(taskScene?.content.referenceDocument).toBeTruthy();

    const task = taskScene?.content.task as {
      leftItems?: unknown[];
      rightItems?: unknown[];
      correctPairs?: unknown[];
    };
    expect((task?.leftItems ?? []).length).toBe(10);
    expect((task?.rightItems ?? []).length).toBe(14);
    expect((task?.correctPairs ?? []).length).toBe(10);
  });

  it("keeps quest-01 scene 09 as minimal drag_drop fixture", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-01-scene-09");
    expect(taskScene?.screen_type).toBe("drag_drop");

    const task = taskScene?.content.task as {
      items?: unknown[];
      targets?: unknown[];
    };
    expect((task?.items ?? []).length).toBe(3);
    expect((task?.targets ?? []).length).toBe(3);
  });

  it("keeps quest-01 scene 10 as medium drag_drop with referenceDocument", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-01-scene-10");
    expect(taskScene?.screen_type).toBe("drag_drop");
    expect(taskScene?.content.referenceDocument).toBeTruthy();

    const task = taskScene?.content.task as {
      items?: unknown[];
      targets?: unknown[];
    };
    expect((task?.items ?? []).length).toBe(6);
    expect((task?.targets ?? []).length).toBe(6);
  });

  it("keeps quest-01 scene 11 as drag_drop bucket fixture", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-01", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-01-quest-01-scene-11");
    expect(taskScene?.screen_type).toBe("drag_drop");

    const task = taskScene?.content.task as {
      targets?: { matchMode?: string }[];
    };
    expect((task?.targets ?? []).length).toBe(1);
    expect(task?.targets?.[0]?.matchMode).toBe("all");
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
