import { describe, expect, it } from "vitest";
import { parseChapterFile, parseQuestFile, parseSceneFile } from "@/lib/game/schemas/contentCatalogSchema";

describe("contentCatalogSchema", () => {
  it("parses valid chapter and quest files", () => {
    const chapter = parseChapterFile({
      id: "chapter-01",
      title: "Bologna",
      order: 1,
      quests: ["quest-01", "quest-01-bonus"],
    });
    const quest = parseQuestFile({
      id: "quest-01",
      title: "Arrivo",
      order: 1,
      kind: "main",
      requiresQuestId: null,
      autoStartQuestId: null,
    });

    expect(chapter.ok).toBe(true);
    expect(quest.ok).toBe(true);
  });

  it("rejects story scene with scoring", () => {
    const scene = parseSceneFile({
      id: "chapter-01-quest-01-scene-01",
      scene_type: "story",
      screen_type: "info",
      background: "chapters/01/quests/01/bg",
      content: { text: "hello" },
      scoring: {
        backpack: { pieces: 1 },
        pizza: { mode: "flat", slices: 1 },
      },
    });

    expect(scene.ok).toBe(false);
  });

  it("rejects task scene without backpack scoring", () => {
    const scene = parseSceneFile({
      id: "chapter-01-quest-01-scene-02",
      scene_type: "task",
      screen_type: "multiple_choice",
      background: "chapters/01/quests/01/bg",
      content: {
        title: "x",
        task: {},
      },
      scoring: {
        pizza: { mode: "flat", slices: 1 },
      },
    });
    expect(scene.ok).toBe(false);
  });
});
