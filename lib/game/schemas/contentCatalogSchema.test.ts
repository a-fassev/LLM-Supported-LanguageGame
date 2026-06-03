import { describe, expect, it } from "vitest";
import { parseChapterFile, parseQuestFile, parseSceneFile } from "@/lib/game/schemas/contentCatalogSchema";

describe("contentCatalogSchema", () => {
  it("parses valid chapter and quest files", () => {
    const chapter = parseChapterFile({
      id: "chapter-01",
      title: "Bologna",
      order: 1,
      quests: ["quest-01", "quest-01-bonus"],
      background: "chapters/01/chapter/bg-missions",
    });
    const quest = parseQuestFile({
      id: "quest-01",
      title: "Arrivo",
      order: 1,
      kind: "main",
      requiresQuestId: null,
      background: "chapters/01/quests/01/bg-overview",
    });

    expect(chapter.ok).toBe(true);
    expect(quest.ok).toBe(true);
  });

  it("parses chapter order 0 and reference flag", () => {
    const reference = parseChapterFile({
      id: "chapter-00",
      title: "Sandbox tecnica",
      order: 0,
      reference: true,
      quests: ["quest-01"],
      background: "chapters/00/chapter/bg-missions",
    });
    expect(reference.ok).toBe(true);
    if (reference.ok) {
      expect(reference.value.order).toBe(0);
      expect(reference.value.reference).toBe(true);
    }
  });

  it("parses chapter gameFinale flag and defaults to false", () => {
    const parsed = parseChapterFile({
      id: "chapter-01",
      title: "Bologna",
      order: 1,
      quests: ["quest-01"],
      background: "chapters/01/chapter/bg-missions",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.gameFinale).toBe(false);
    }

    const finale = parseChapterFile({
      id: "chapter-06",
      title: "Bologna — sesto giorno",
      order: 6,
      gameFinale: true,
      quests: ["quest-01", "quest-01-bonus"],
      background: "chapters/06/chapter/bg-missions",
    });
    expect(finale.ok).toBe(true);
    if (finale.ok) {
      expect(finale.value.gameFinale).toBe(true);
    }
  });

  it("parses chapter locked flag and defaults to false", () => {
    const locked = parseChapterFile({
      id: "chapter-03",
      title: "Roma",
      order: 3,
      locked: true,
      quests: ["quest-01"],
      background: "chapters/03/chapter/bg-missions",
    });
    const unlocked = parseChapterFile({
      id: "chapter-01",
      title: "Bologna",
      order: 1,
      quests: ["quest-01"],
      background: "chapters/01/chapter/bg-missions",
    });

    expect(locked.ok).toBe(true);
    if (locked.ok) expect(locked.value.locked).toBe(true);
    expect(unlocked.ok).toBe(true);
    if (unlocked.ok) expect(unlocked.value.locked).toBe(false);
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
