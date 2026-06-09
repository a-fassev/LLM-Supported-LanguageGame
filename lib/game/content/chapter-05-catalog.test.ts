import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadContentCatalog,
  resetContentCatalogCacheForTests,
} from "@/lib/game/content/catalog-loader";

describe("chapter-05 Bologna Lezione 5 catalog", () => {
  it("loads five quests with expected scene counts and bonus wiring", async () => {
    resetContentCatalogCacheForTests();
    const catalog = await loadContentCatalog({ bypassCache: true });
    const chapter = catalog.chapters.find((c) => c.id === "chapter-05");
    expect(chapter).toBeDefined();
    expect(chapter?.title).toBe("La gita di classe");
    expect(chapter?.order).toBe(5);
    expect(chapter?.locked).toBe(false);
    expect(chapter?.background).toBe("chapters/05/chapter/bg-missions");
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
      "quest-01": 5,
      "quest-02": 7,
      "quest-03": 7,
      "quest-04": 7,
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
    expect(bonus?.title).toBe("Extra: parole della lezione 5");

    const bonusTask = bonus!.scenes.find(
      (s) => s.scene_type === "task" && s.screen_type === "matching",
    );
    expect(bonusTask?.content.task).toMatchObject({ sampleSize: 10 });
    const poolPairs = bonusTask?.content.task.poolPairs as unknown[];
    expect(poolPairs?.length).toBeGreaterThanOrEqual(70);

    const luccaMc = chapter!.questsExpanded
      .find((q) => q.id === "quest-02")
      ?.scenes.find((s) => s.id === "chapter-05-quest-02-scene-04");
    expect(luccaMc?.screen_type).toBe("multiple_choice");
    const questions = (luccaMc?.content.task as { questions?: unknown[] } | undefined)
      ?.questions;
    expect(questions?.length).toBe(5);
    expect(luccaMc?.content.referenceDocument?.body).toContain("Lucca Comics and Games");

    const assetManifest = path.join(
      process.cwd(),
      "public/content-assets/chapters/05/ASSET_KEYS.txt",
    );
    expect(fs.existsSync(assetManifest)).toBe(true);
    const manifest = fs.readFileSync(assetManifest, "utf8");
    expect(manifest).toContain("bg-caffe-giardini.png");
    expect(manifest).toContain("bg-room-evening.png");

    const quest03 = chapter!.questsExpanded.find((q) => q.id === "quest-03");
    expect(quest03?.scenes[3]?.screen_type).toBe("drag_drop");
    expect(quest03?.scenes[4]?.screen_type).toBe("cloze");
    expect(quest03?.scenes[5]?.content.text).toMatch(/decisione è presa: vince Lucca/);

    const saraChat = chapter!.questsExpanded
      .find((q) => q.id === "quest-01")
      ?.scenes.find((s) => s.id === "chapter-05-quest-01-scene-02");
    expect(saraChat?.content.text).toMatch(/^Sara\n„/);
  });
});
