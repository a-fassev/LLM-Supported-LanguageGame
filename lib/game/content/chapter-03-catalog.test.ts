import { describe, expect, it } from "vitest";
import {
  loadContentCatalog,
  resetContentCatalogCacheForTests,
} from "@/lib/game/content/catalog-loader";
import { sanitizeSceneContentForClient } from "@/lib/game/content/sanitize-task-payload-for-client";
import { toReferenceDocumentView } from "@/lib/game/reference-document-view";

describe("chapter-03 Bologna Lezione 3 catalog", () => {
  it("loads five quests with expected scene counts and bonus wiring", async () => {
    resetContentCatalogCacheForTests();
    const catalog = await loadContentCatalog({ bypassCache: true });
    const chapter = catalog.chapters.find((c) => c.id === "chapter-03");
    expect(chapter).toBeDefined();
    expect(chapter?.title).toBe("Bologna — terzo giorno");
    expect(chapter?.order).toBe(3);
    expect(chapter?.locked).toBe(false);
    expect(chapter?.background).toBe("chapters/03/chapter/bg-missions");
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
      "quest-02": 7,
      "quest-03": 17,
      "quest-04": 18,
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
    expect(bonus?.title).toMatch(/^Extra:/);

    const bonusTask = bonus!.scenes.find(
      (s) => s.scene_type === "task" && s.screen_type === "matching",
    );
    expect(bonusTask?.content.task).toMatchObject({ sampleSize: 10 });
    const poolPairs = bonusTask?.content.task.poolPairs as unknown[];
    expect(poolPairs?.length).toBeGreaterThanOrEqual(100);

    const valentinaLavagna = chapter!.questsExpanded
      .find((q) => q.id === "quest-03")
      ?.scenes.find((s) => s.id === "chapter-03-quest-03-scene-11");
    expect(valentinaLavagna?.content.text).toContain("lavagna");
    expect(valentinaLavagna?.content.text).not.toMatch(/^Valentina\n/);

    const museumMc = chapter!.questsExpanded
      .find((q) => q.id === "quest-02")
      ?.scenes.find((s) => s.id === "chapter-03-quest-02-scene-05");
    expect(museumMc?.content.referenceDocument).toMatchObject({
      title: "Bologna — duemila anni di storia",
    });
    const museumQuestions = (
      museumMc?.content.task as { questions?: unknown[] } | undefined
    )?.questions;
    expect(museumQuestions?.length).toBe(6);

    const lorenzoMc = chapter!.questsExpanded
      .find((q) => q.id === "quest-04")
      ?.scenes.find((s) => s.id === "chapter-03-quest-04-scene-08");
    expect(lorenzoMc?.content.referenceDocument).toMatchObject({
      title: "Lorenzo Conti racconta",
    });
    const lorenzoQuestions = (
      lorenzoMc?.content.task as { questions?: unknown[] } | undefined
    )?.questions;
    expect(lorenzoQuestions?.length).toBe(4);

    const dragScene = chapter!.questsExpanded
      .find((q) => q.id === "quest-04")
      ?.scenes.find((s) => s.id === "chapter-03-quest-04-scene-15");
    const sanitizedDrag = sanitizeSceneContentForClient(
      "task",
      "drag_drop",
      dragScene!.content as Record<string, unknown>,
    );
    const dragView = toReferenceDocumentView(sanitizedDrag.referenceDocument);
    expect(dragView?.body).toContain("Made in Italy");
    const dragTask = dragScene?.content.task as {
      items?: unknown[];
      targets?: { id: string }[];
    };
    expect(dragTask?.items?.length).toBe(13);
    expect(dragTask?.targets?.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        "torino",
        "bologna",
        "alba",
        "napoli",
        "parma",
        "non-italiano",
      ]),
    );
  });
});
