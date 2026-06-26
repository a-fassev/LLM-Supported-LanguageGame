import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  afterEach(() => {
    vi.useRealTimers();
    vi.stubEnv("NODE_ENV", "development");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
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
              scenes: [{ scene_type: "task" }],
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
      backpackProgressPercent: 100,
      backpackCompletedTasks: 1,
      backpackTotalTasks: 1,
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
          unlocksAt: null,
          scheduleLocked: false,
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

  it("includes schedule fields in bootstrap chapters", async () => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", "production");
    vi.setSystemTime(new Date("2026-06-20T12:00:00+02:00"));

    const result = await bootstrapGameState("account-1");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.chapters[0]?.scheduleLocked).toBe(true);
    expect(result.chapters[0]?.unlocksAt).toBe("2026-07-06T06:30:00.000Z");
    vi.useRealTimers();
    vi.stubEnv("NODE_ENV", "development");
  });
});
