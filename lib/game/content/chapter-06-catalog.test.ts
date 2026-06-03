import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadContentCatalog,
  resetContentCatalogCacheForTests,
} from "@/lib/game/content/catalog-loader";

describe("chapter-06 Bologna Lezione 6 catalog", () => {
  it("loads five quests with expected scene counts and bonus wiring", async () => {
    resetContentCatalogCacheForTests();
    const catalog = await loadContentCatalog({ bypassCache: true });
    const chapter = catalog.chapters.find((c) => c.id === "chapter-06");
    expect(chapter).toBeDefined();
    expect(chapter?.title).toBe("Bologna — sesto giorno");
    expect(chapter?.order).toBe(6);
    expect(chapter?.locked).toBe(false);
    expect(chapter?.gameFinale).toBe(true);
    expect(chapter?.background).toBe("chapters/06/chapter/bg-missions");
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
      "quest-02": 6,
      "quest-03": 4,
      "quest-04": 4,
      "quest-01-bonus": 7,
    });

    const mainQuests = chapter!.questsExpanded.filter((q) => q.kind === "main");
    expect(mainQuests[0].requiresQuestId).toBeNull();
    expect(mainQuests[1].requiresQuestId).toBe("quest-01");
    expect(mainQuests[2].requiresQuestId).toBe("quest-02");
    expect(mainQuests[3].requiresQuestId).toBe("quest-03");

    const bonus = chapter!.questsExpanded.find((q) => q.id === "quest-01-bonus");
    expect(bonus?.kind).toBe("bonus");
    expect(bonus?.requiresQuestId).toBe("quest-04");
    expect(bonus?.title).toBe("Extra: parole della lezione 6");

    const bonusTask = bonus!.scenes.find(
      (s) => s.scene_type === "task" && s.screen_type === "matching",
    );
    expect(bonusTask?.content.task).toMatchObject({ sampleSize: 10 });
    const poolPairs = bonusTask?.content.task.poolPairs as unknown[];
    expect(poolPairs?.length).toBeGreaterThanOrEqual(80);

    const profLines = chapter!.questsExpanded
      .find((q) => q.id === "quest-02")
      ?.scenes.find((s) => s.id === "chapter-06-quest-02-scene-03");
    expect(profLines?.screen_type).toBe("matching");
    expect(profLines?.content.referenceDocument?.body).toContain("È il Sognatore");
    expect(profLines?.content.referenceDocument?.body).not.toMatch(/\bMerda\b/i);

    const signoraClose = chapter!.questsExpanded
      .find((q) => q.id === "quest-03")
      ?.scenes.find((s) => s.id === "chapter-06-quest-03-scene-04");
    expect(signoraClose?.content.text).toMatch(/Signora\n„Perfetto/);

    const quizMc = chapter!.questsExpanded
      .find((q) => q.id === "quest-04")
      ?.scenes.find((s) => s.id === "chapter-06-quest-04-scene-03");
    const questions = (quizMc?.content.task as { questions?: unknown[] } | undefined)
      ?.questions;
    expect(questions?.length).toBe(16);

    const quest03 = chapter!.questsExpanded.find((q) => q.id === "quest-03");
    expect(quest03?.scenes[2]?.screen_type).toBe("cloze");
    expect(quest03?.scenes[2]?.content.referenceDocument?.figures?.length).toBe(7);

    const assetManifest = path.join(
      process.cwd(),
      "public/content-assets/chapters/06/ASSET_KEYS.txt",
    );
    expect(fs.existsSync(assetManifest)).toBe(true);
    const manifest = fs.readFileSync(assetManifest, "utf8");
    expect(manifest).toContain("bg-piazza-maggiore.png");
    expect(manifest).toContain("ref-sicilia-01.png");
    expect(manifest).toContain("bg-finale.png");

    const finaleScene = bonus!.scenes.find(
      (s) => s.id === "chapter-06-quest-01-bonus-scene-07",
    );
    expect(finaleScene?.content.text).toMatch(/^Tu\n/);
    expect(finaleScene?.background).toBe("chapters/06/quests/bonus/bg-finale");
  });
});
