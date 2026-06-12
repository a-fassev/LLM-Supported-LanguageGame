import { describe, expect, it } from "vitest";
import { isQuestLockedForAccount } from "@/lib/game/quest-progression-lock";
import type { ContentCatalog } from "@/lib/game/content/catalog-loader";

function catalogFixture(): ContentCatalog {
  return {
    chapters: [
      {
        id: "chapter-01",
        title: "Capitolo 1",
        order: 1,
        locked: false,
        reference: false,
        quests: ["quest-01", "quest-02", "quest-01-bonus"],
        questsExpanded: [
          {
            id: "quest-01",
            title: "Q1",
            order: 1,
            kind: "main",
            requiresQuestId: null,
            scenes: [],
          },
          {
            id: "quest-02",
            title: "Q2",
            order: 2,
            kind: "main",
            requiresQuestId: "quest-01",
            scenes: [],
          },
          {
            id: "quest-01-bonus",
            title: "Bonus",
            order: 3,
            kind: "bonus",
            requiresQuestId: "quest-02",
            scenes: [],
          },
        ],
      },
    ],
  };
}

describe("isQuestLockedForAccount", () => {
  it("requires completing chapter-00 tutorial before chapter-01", () => {
    const catalog: ContentCatalog = {
      chapters: [
        {
          id: "chapter-00",
          title: "La valigia",
          order: 0,
          locked: false,
          reference: false,
          quests: ["quest-01"],
          questsExpanded: [
            {
              id: "quest-01",
              title: "Come si gioca",
              order: 1,
              kind: "main",
              requiresQuestId: null,
              scenes: [],
            },
          ],
        },
        catalogFixture().chapters[0],
      ],
    };
    expect(isQuestLockedForAccount(catalog, "chapter-01", "quest-01", new Set())).toBe(true);
    expect(
      isQuestLockedForAccount(catalog, "chapter-01", "quest-01", new Set(["chapter-00:quest-01"])),
    ).toBe(false);
  });

  it("does not require completing reference chapter-00 before chapter-01", () => {
    const catalog: ContentCatalog = {
      chapters: [
        {
          id: "chapter-00",
          title: "Sandbox",
          order: 0,
          locked: false,
          reference: true,
          quests: ["quest-01"],
          questsExpanded: [
            {
              id: "quest-01",
              title: "Sandbox Q",
              order: 1,
              kind: "main",
              requiresQuestId: null,
              scenes: [],
            },
          ],
        },
        catalogFixture().chapters[0],
      ],
    };
    expect(isQuestLockedForAccount(catalog, "chapter-01", "quest-01", new Set())).toBe(false);
  });

  it("returns true when chapter is manually locked", () => {
    const catalog: ContentCatalog = {
      chapters: [
        {
          ...catalogFixture().chapters[0],
          locked: true,
        },
      ],
    };
    expect(isQuestLockedForAccount(catalog, "chapter-01", "quest-01", new Set())).toBe(true);
  });
});
