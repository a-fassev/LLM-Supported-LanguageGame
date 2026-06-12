import { afterEach, describe, expect, it } from "vitest";
import { findCatalogQuest, loadContentCatalog, resetContentCatalogCacheForTests } from "@/lib/game/content/catalog-loader";
import { evaluateTaskAttempt } from "@/lib/game/scoring/evaluateTaskAttempt";
import { meetsScoredPizzaMinimum, parsePizzaRewardRules } from "@/lib/game/scoring/pizzaReward";

describe("chapter-00 tutorial content", () => {
  afterEach(() => {
    resetContentCatalogCacheForTests();
  });

  it("loads tutorial chapter without reference flag", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const chapter = catalog.chapters.find((c) => c.id === "chapter-00");
    expect(chapter?.title).toBe("La valigia — Prima del viaggio");
    expect(chapter?.reference).toBeFalsy();
    expect(chapter?.questsExpanded).toHaveLength(1);
    expect(chapter?.questsExpanded[0]?.id).toBe("quest-01");
    expect(chapter?.questsExpanded[0]?.title).toBe("Come si gioca");
  });

  it("has 2 story + 7 task scenes in tutorial order", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    expect(quest?.scenes.map((scene) => scene.screen_type)).toEqual([
      "info",
      "multiple_choice",
      "matching",
      "drag_drop",
      "cloze",
      "error_spotting",
      "multiple_choice",
      "free_text",
      "info",
    ]);
    expect(quest?.scenes).toHaveLength(9);
  });

  it("uses scored pizza with zero max slices and zero backpack on every task scene", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const tasks = quest?.scenes.filter((scene) => scene.scene_type === "task") ?? [];
    expect(tasks.length).toBe(7);
    for (const scene of tasks) {
      expect(scene.scoring.backpack.pieces, scene.id).toBe(0);
      const rules = parsePizzaRewardRules({ pizza: scene.scoring.pizza });
      expect(rules.kind, scene.id).toBe("scored");
      if (rules.kind === "scored") {
        expect(rules.maxSlices, scene.id).toBe(0);
        expect(rules.minRatioToComplete, scene.id).toBe(1);
      }
    }
  });

  it("evaluates tutorial multiple choice and rejects a wrong answer", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const mc = quest?.scenes.find((s) => s.id === "chapter-00-quest-01-scene-02");
    expect(mc?.scene_type).toBe("task");

    const task = mc?.content.task as {
      selectionMode: string;
      correctOptionIds: string[];
      options: { id: string; label: string }[];
    };
    const rules = parsePizzaRewardRules({ pizza: mc?.scoring.pizza });

    const wrong = evaluateTaskAttempt("MultipleChoice", task, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: [["opt-sciarpa"]] },
    });
    expect(wrong.ok).toBe(true);
    if (!wrong.ok) throw new Error("expected evaluation");
    expect(wrong.ratio).toBe(0);
    expect(meetsScoredPizzaMinimum(wrong.ratio, rules)).toBe(false);

    const correct = evaluateTaskAttempt("MultipleChoice", task, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: [["opt-passaporto"]] },
    });
    expect(correct.ok).toBe(true);
    if (!correct.ok) throw new Error("expected evaluation");
    expect(correct.ratio).toBe(1);
    expect(meetsScoredPizzaMinimum(correct.ratio, rules)).toBe(true);
  });

  it("covers each task type once with simple payloads", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    const quest = findCatalogQuest(catalog, "chapter-00", "quest-01");
    const mc = quest?.scenes.find((s) => s.id === "chapter-00-quest-01-scene-02");
    const task = mc?.content.task as { options?: unknown[] } | undefined;
    expect((task?.options ?? []).length).toBe(3);

    const matching = quest?.scenes.find((s) => s.id === "chapter-00-quest-01-scene-03");
    const pairs = (matching?.content.task as { correctPairs?: unknown[] })?.correctPairs;
    expect(pairs?.length).toBe(3);

    const docMc = quest?.scenes.find((s) => s.id === "chapter-00-quest-01-scene-07");
    expect(docMc?.content.referenceDocument?.title).toBe("Consigli della famiglia Ferrari");
  });
});
