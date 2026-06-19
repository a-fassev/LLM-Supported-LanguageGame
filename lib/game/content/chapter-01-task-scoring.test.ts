import { describe, expect, it } from "vitest";
import {
  loadContentCatalog,
  resetContentCatalogCacheForTests,
} from "@/lib/game/content/catalog-loader";
import { evaluateCloze } from "@/lib/game/scoring/evaluateTaskAttempt";

async function loadFamiglieScene() {
  resetContentCatalogCacheForTests();
  const catalog = await loadContentCatalog({ bypassCache: true });
  const chapter = catalog.chapters.find((c) => c.id === "chapter-01");
  const quest = chapter?.questsExpanded.find((q) => q.id === "quest-04");
  const scene = quest?.scenes.find((s) => s.id === "chapter-01-quest-04-scene-08");
  expect(scene?.screen_type).toBe("cloze");
  return scene!.content.task as {
    lines: { segments: { kind?: string; correctAnswers?: string[] }[] }[];
  };
}

describe("chapter-01 task answer keys (server scoring)", () => {
  it("Famiglie di parole accepts nouns with or without definite article", async () => {
    const task = await loadFamiglieScene();
    const withArticle = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: {
        answers: [
          "la visita",
          "aperte",
          "la profondità",
          "la larghezza",
          "l'umidità",
          "la durata",
          "parziale",
          "la lunghezza",
        ],
      },
    });
    expect(withArticle).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 8, itemsTotal: 8 });

    const withoutArticle = evaluateCloze(task, {
      taskType: "ClozeText",
      clozeText: {
        answers: [
          "visita",
          "aperte",
          "profondità",
          "larghezza",
          "umidità",
          "durata",
          "parziale",
          "lunghezza",
        ],
      },
    });
    expect(withoutArticle).toMatchObject({ ok: true, ratio: 1, itemsCorrect: 8, itemsTotal: 8 });
  });
});
