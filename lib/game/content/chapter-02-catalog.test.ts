import { describe, expect, it } from "vitest";
import {
  loadContentCatalog,
  resetContentCatalogCacheForTests,
} from "@/lib/game/content/catalog-loader";
import { sanitizeSceneContentForClient } from "@/lib/game/content/sanitize-task-payload-for-client";
import { toReferenceDocumentView } from "@/lib/game/reference-document-view";

describe("chapter-02 Bologna Lezione 2 catalog", () => {
  it("loads five quests with expected scene counts and bonus wiring", async () => {
    resetContentCatalogCacheForTests();
    const catalog = await loadContentCatalog({ bypassCache: true });
    const chapter = catalog.chapters.find((c) => c.id === "chapter-02");
    expect(chapter).toBeDefined();
    expect(chapter?.title).toBe("Sogni e progetti");
    expect(chapter?.order).toBe(2);
    expect(chapter?.locked).toBe(false);
    expect(chapter?.background).toBe("chapters/02/chapter/bg-missions");
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
      "quest-01": 3,
      "quest-02": 15,
      "quest-03": 13,
      "quest-04": 21,
      "quest-01-bonus": 4,
    });

    const mainQuests = chapter!.questsExpanded.filter((q) => q.kind === "main");
    expect(mainQuests[0].requiresQuestId).toBeNull();
    expect(mainQuests[1].requiresQuestId).toBe("quest-01");
    expect(mainQuests[2].requiresQuestId).toBe("quest-02");
    expect(mainQuests[3].requiresQuestId).toBe("quest-03");

    const bonus = chapter!.questsExpanded.find((q) => q.id === "quest-01-bonus");
    expect(bonus?.kind).toBe("bonus");
    expect(bonus?.requiresQuestId).toBe("quest-04");

    const bonusTask = bonus!.scenes.find(
      (s) => s.scene_type === "task" && s.screen_type === "matching",
    );
    expect(bonusTask?.content.task).toMatchObject({ sampleSize: 10 });
    const poolPairs = bonusTask?.content.task.poolPairs as unknown[];
    expect(poolPairs?.length).toBeGreaterThanOrEqual(50);

    const steckbrief = chapter!.questsExpanded
      .find((q) => q.id === "quest-03")
      ?.scenes.find((s) => s.id === "chapter-02-quest-03-scene-04");
    const ref = steckbrief?.content.referenceDocument as {
      sections?: unknown[];
    };
    expect(ref?.sections?.length).toBe(3);

    const quizMc = chapter!.questsExpanded
      .find((q) => q.id === "quest-03")
      ?.scenes.find((s) => s.id === "chapter-02-quest-03-scene-06");
    const quizRef = quizMc?.content.referenceDocument as { figures?: unknown[] };
    expect(quizRef?.figures?.length).toBe(6);

    const sanitizedQuiz = sanitizeSceneContentForClient(
      "task",
      "multiple_choice",
      quizMc!.content as Record<string, unknown>,
    );
    const quizView = toReferenceDocumentView(sanitizedQuiz.referenceDocument);
    expect(quizView?.figures).toHaveLength(6);
  });
});
