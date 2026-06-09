import { describe, expect, it } from "vitest";
import { loadContentCatalog } from "@/lib/game/content/catalog-loader";
import { BACKPACK_PROGRESS_CHAPTER_IDS } from "@/lib/game/backpack-progress";

const PIZZA_MAX_BY_SCREEN_TYPE: Record<string, number> = {
  matching: 5,
  drag_drop: 5,
  multiple_choice: 5,
  cloze: 10,
  error_spotting: 10,
  free_text: 15,
};

describe("learner chapter scoring tiers (chapter-01..06)", () => {
  it("uses scored pizza with 5/10/15 maxSlices and nearest rounding", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });

    for (const chapterId of BACKPACK_PROGRESS_CHAPTER_IDS) {
      const chapter = catalog.chapters.find((entry) => entry.id === chapterId);
      expect(chapter, `missing ${chapterId}`).toBeTruthy();

      for (const quest of chapter!.questsExpanded) {
        for (const scene of quest.scenes) {
          if (scene.scene_type !== "task") continue;

          const expectedMax = PIZZA_MAX_BY_SCREEN_TYPE[scene.screen_type];
          expect(expectedMax, `${scene.id} screen_type`).toBeTruthy();

          const pizza = scene.scoring.pizza as {
            mode: string;
            maxSlices?: number;
            rounding?: string;
          };
          expect(pizza.mode, scene.id).toBe("scored");
          expect(pizza.maxSlices, scene.id).toBe(expectedMax);
          expect(pizza.rounding, scene.id).toBe("nearest");
          expect(scene.scoring.backpack.pieces, scene.id).toBe(1);
        }
      }
    }
  });
});
