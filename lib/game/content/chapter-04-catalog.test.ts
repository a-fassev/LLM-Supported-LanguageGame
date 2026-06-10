import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadContentCatalog,
  resetContentCatalogCacheForTests,
} from "@/lib/game/content/catalog-loader";

describe("chapter-04 Bologna Lezione 4 catalog", () => {
  it("loads five quests with expected scene counts and bonus wiring", async () => {
    resetContentCatalogCacheForTests();
    const catalog = await loadContentCatalog({ bypassCache: true });
    const chapter = catalog.chapters.find((c) => c.id === "chapter-04");
    expect(chapter).toBeDefined();
    expect(chapter?.title).toBe("Amici e sentimenti");
    expect(chapter?.order).toBe(4);
    expect(chapter?.locked).toBe(false);
    expect(chapter?.background).toBe("chapters/04/chapter/bg-missions");
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
      "quest-02": 20,
      "quest-03": 6,
      "quest-04": 12,
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
    expect(bonus?.title).toBe("Extra: parole della lezione 4");

    const bonusTask = bonus!.scenes.find(
      (s) => s.scene_type === "task" && s.screen_type === "matching",
    );
    expect(bonusTask?.content.task).toMatchObject({ sampleSize: 10 });
    const poolPairs = bonusTask?.content.task.poolPairs as unknown[];
    expect(poolPairs?.length).toBeGreaterThanOrEqual(90);

    const fotoTask = chapter!.questsExpanded
      .find((q) => q.id === "quest-02")
      ?.scenes.find((s) => s.id === "chapter-04-quest-02-scene-07");
    expect(fotoTask?.screen_type).toBe("free_text");
    const figures = fotoTask?.content.referenceDocument?.figures as unknown[] | undefined;
    expect(figures?.length).toBe(4);

    const invitoMc = chapter!.questsExpanded
      .find((q) => q.id === "quest-04")
      ?.scenes.find((s) => s.id === "chapter-04-quest-04-scene-05");
    const invitoQuestions = (
      invitoMc?.content.task as { questions?: unknown[] } | undefined
    )?.questions;
    expect(invitoQuestions?.length).toBe(4);

    const saraThanks = chapter!.questsExpanded
      .find((q) => q.id === "quest-02")
      ?.scenes.find((s) => s.id === "chapter-04-quest-02-scene-08");
    expect(saraThanks?.content.text).toMatch(/sfogarmi un po'\. Sono delle foto bellissime, vero\? Ma mi rendono tristissima\."$/);

    const saraCloze = chapter!.questsExpanded
      .find((q) => q.id === "quest-02")
      ?.scenes.find((s) => s.id === "chapter-04-quest-02-scene-14");
    expect(saraCloze?.content.instruction).toContain("Parole disponibili:");
    expect(saraCloze?.content.instruction).not.toContain("Wortbank");

    const assetManifest = path.join(
      process.cwd(),
      "public/content-assets/chapters/04/ASSET_KEYS.txt",
    );
    expect(fs.existsSync(assetManifest)).toBe(true);
    const manifest = fs.readFileSync(assetManifest, "utf8");
    expect(manifest).toContain("ref-foto-cattedrale.png");
    expect(manifest).toContain("bg-giardini-margherita.png");
  });
});
