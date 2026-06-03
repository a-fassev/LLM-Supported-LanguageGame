import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureWalletRow: vi.fn(),
  getWalletTotals: vi.fn(),
  getCompletedQuestIds: vi.fn(),
  loadContentCatalog: vi.fn(),
}));

vi.mock("@/lib/game/repositories/game-progress-repository", () => ({
  ensureWalletRow: mocks.ensureWalletRow,
  getWalletTotals: mocks.getWalletTotals,
  getCompletedQuestIds: mocks.getCompletedQuestIds,
}));

vi.mock("@/lib/game/content/catalog-loader", () => ({
  loadContentCatalog: mocks.loadContentCatalog,
}));

import { bootstrapGameState } from "@/lib/game/services/game-progress-service";

describe("bootstrapGameState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureWalletRow.mockResolvedValue(true);
    mocks.getWalletTotals.mockResolvedValue({ totalSlices: 3, totalBackpackPieces: 1 });
    mocks.getCompletedQuestIds.mockResolvedValue([]);
    mocks.loadContentCatalog.mockResolvedValue({
      chapters: [
        {
          id: "chapter-01",
          title: "Bologna",
          order: 1,
          locked: false,
          reference: false,
          gameFinale: false,
          background: "chapters/01/chapter/bg-missions",
          questsExpanded: [
            {
              id: "quest-01",
              title: "Arrivo",
              order: 1,
              kind: "main",
              requiresQuestId: null,
              background: "chapters/01/quests/01/bg-overview",
              scenes: [],
            },
          ],
        },
      ],
    });
  });

  it("returns wallet totals and chapter catalog", async () => {
    const result = await bootstrapGameState("account-1");

    expect(result).toEqual({
      ok: true,
      totalSlices: 3,
      totalBackpackPieces: 1,
      completedQuestIds: [],
      chapters: [
        {
          id: "chapter-01",
          title: "Bologna",
          order: 1,
          locked: false,
          reference: false,
          gameFinale: false,
          background: "chapters/01/chapter/bg-missions",
          quests: [
            {
              id: "quest-01",
              title: "Arrivo",
              order: 1,
              kind: "main",
              requiresQuestId: null,
              background: "chapters/01/quests/01/bg-overview",
            },
          ],
        },
      ],
    });
    expect(mocks.ensureWalletRow).toHaveBeenCalledWith("account-1");
    expect(mocks.getWalletTotals).toHaveBeenCalledWith("account-1");
    expect(mocks.loadContentCatalog).toHaveBeenCalled();
  });

  it("fails when the wallet cannot be ensured", async () => {
    mocks.ensureWalletRow.mockResolvedValue(false);

    const result = await bootstrapGameState("account-1");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(500);
  });

  it("fails when catalog load fails", async () => {
    mocks.loadContentCatalog.mockRejectedValue(new Error("boom"));

    const result = await bootstrapGameState("account-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("catalog_unavailable");
    }
  });
});
