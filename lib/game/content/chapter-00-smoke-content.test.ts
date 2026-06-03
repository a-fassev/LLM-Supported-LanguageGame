import { afterEach, describe, expect, it } from "vitest";
import { findCatalogQuest, loadContentCatalog, resetContentCatalogCacheForTests } from "@/lib/game/content/catalog-loader";

describe("chapter-00 smoke content", () => {
  afterEach(() => {
    resetContentCatalogCacheForTests();
  });

  it("keeps quest-01 story preview scenes before MC and matching fixtures", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
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
      "free_text",
      "error_spotting",
      "error_spotting",
      "cloze",
      "cloze",
    ]);
  });

  it("keeps quest-01 scene 04 as minimal flat multiple-choice", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-04");
    expect(taskScene?.scene_type).toBe("task");
    expect(taskScene?.screen_type).toBe("multiple_choice");

    const task = taskScene?.content.task as { options?: unknown[]; questions?: unknown[] } | undefined;
    expect(Array.isArray(task?.options)).toBe(true);
    expect((task?.options ?? []).length).toBeGreaterThanOrEqual(2);
    expect(task?.questions).toBeUndefined();
  });

  it("keeps quest-01 scene 05 as rich multiple-choice with questions[]", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-05");
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
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-06");
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
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-07");
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
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-08");
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
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-09");
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
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-10");
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
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-11");
    expect(taskScene?.screen_type).toBe("drag_drop");

    const task = taskScene?.content.task as {
      targets?: { matchMode?: string }[];
    };
    expect((task?.targets ?? []).length).toBe(1);
    expect(task?.targets?.[0]?.matchMode).toBe("all");
  });

  it("keeps quest-01 scene 12 as minimal free_text fixture with single figure documento", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-12");
    expect(taskScene?.screen_type).toBe("free_text");

    const task = taskScene?.content.task as {
      prompt?: string;
      minWords?: number;
      evaluation?: { passThreshold?: number };
    };
    expect(typeof task?.prompt).toBe("string");
    expect(task?.minWords).toBe(2);
    expect(taskScene?.scoring.pizza).toMatchObject({ mode: "scored", minRatioToComplete: 0.7 });
    const ref = taskScene?.content.referenceDocument as { figures?: unknown[] };
    expect(ref?.figures?.length).toBe(1);
  });

  it("keeps quest-01 scene 04 MC fixture with six-figure documento gallery", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-04");
    expect(taskScene?.screen_type).toBe("multiple_choice");
    const ref = taskScene?.content.referenceDocument as { figures?: unknown[] };
    expect(ref?.figures?.length).toBe(6);
  });

  it("keeps quest-01 scene 13 as short error_spotting fixture", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-13");
    expect(taskScene?.screen_type).toBe("error_spotting");

    const task = taskScene?.content.task as {
      segments?: { isError?: boolean; acceptedCorrections?: string[] }[];
    };
    const errorSegments = (task?.segments ?? []).filter((segment) => segment.isError === true);
    expect(errorSegments.length).toBe(2);
    expect(errorSegments.every((segment) => (segment.acceptedCorrections ?? []).length > 0)).toBe(true);
    expect(taskScene?.scoring.pizza).toMatchObject({ mode: "flat", slices: 2 });
  });

  it("keeps quest-01 scene 14 as long error_spotting fixture", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-14");
    expect(taskScene?.screen_type).toBe("error_spotting");

    const task = taskScene?.content.task as {
      segments?: { text?: string; isError?: boolean }[];
    };
    const joinedText = (task?.segments ?? []).map((segment) => segment.text ?? "").join("");
    expect(joinedText.length).toBeGreaterThan(4800);
    expect((task?.segments ?? []).length).toBeGreaterThan(500);
    const errorSegments = (task?.segments ?? []).filter((segment) => segment.isError === true);
    expect(errorSegments.length).toBe(6);
    expect(taskScene?.scoring.pizza).toMatchObject({ mode: "scored", minRatioToComplete: 1 });
  });

  it("keeps quest-01 scene 15 as minimal cloze fixture", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-15");
    expect(taskScene?.screen_type).toBe("cloze");

    const task = taskScene?.content.task as {
      lines?: { segments: { kind: string; text?: string }[] }[];
    } | undefined;
    const gapCount = (task?.lines ?? []).reduce(
      (total, line) => total + line.segments.filter((segment) => segment.kind === "gap").length,
      0,
    );
    const joinedText = (task?.lines ?? [])
      .flatMap((line) => line.segments)
      .filter((segment) => segment.kind === "text")
      .map((segment) => segment.text ?? "")
      .join("");
    expect(gapCount).toBe(2);
    expect(joinedText.length).toBeGreaterThan(2000);
    expect(taskScene?.scoring.pizza).toMatchObject({ mode: "scored", minRatioToComplete: 1 });
  });

  it("keeps quest-01 scene 16 as rich cloze fixture", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-scene-16");
    expect(taskScene?.screen_type).toBe("cloze");
    expect(taskScene?.content.referenceDocument).toBeTruthy();

    const task = taskScene?.content.task as {
      lines?: { segments: { kind: string; text?: string }[] }[];
    } | undefined;
    const gapCount = (task?.lines ?? []).reduce(
      (total, line) => total + line.segments.filter((segment) => segment.kind === "gap").length,
      0,
    );
    const joinedText = (task?.lines ?? [])
      .flatMap((line) => line.segments)
      .filter((segment) => segment.kind === "text")
      .map((segment) => segment.text ?? "")
      .join("");
    expect(gapCount).toBeGreaterThanOrEqual(6);
    expect(joinedText.length).toBeGreaterThan(2000);
    expect(taskScene?.scoring.pizza).toMatchObject({ mode: "scored", minRatioToComplete: 0.67 });
  });

  it("keeps quest-01-bonus pool matching scene with scored pizza", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01-bonus");
    expect(quest?.kind).toBe("bonus");
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-01-bonus-scene-02");
    expect(taskScene?.screen_type).toBe("matching");

    const task = taskScene?.content.task as {
      poolPairs?: unknown[];
      sampleSize?: number;
      correctPairs?: unknown[];
    };
    expect(Array.isArray(task?.poolPairs)).toBe(true);
    expect(task?.poolPairs?.length).toBeGreaterThan(0);
    expect(task?.sampleSize).toBe(10);
    expect(task?.correctPairs).toBeUndefined();
    expect(taskScene?.scoring.pizza).toMatchObject({ mode: "scored" });
  });

  it("keeps quest-02 matching scene with at least one correct pair", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-02");
    expect(quest).toBeTruthy();
    const taskScene = quest?.scenes.find((scene) => scene.id === "chapter-00-quest-02-scene-02");
    expect(taskScene?.scene_type).toBe("task");
    expect(taskScene?.screen_type).toBe("matching");

    const correctPairs =
      (taskScene?.content.task as { correctPairs?: unknown[] } | undefined)?.correctPairs ?? [];
    expect(Array.isArray(correctPairs)).toBe(true);
    expect(correctPairs.length).toBeGreaterThan(0);
  });
});
