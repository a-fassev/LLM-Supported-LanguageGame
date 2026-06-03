import { beforeEach, describe, expect, it, vi } from "vitest";

const repoMocks = vi.hoisted(() => ({
  ensureWalletRow: vi.fn(),
  getActiveQuestRun: vi.fn(),
  getCompletedQuestIds: vi.fn(),
  getCompletedSceneIds: vi.fn(),
  getWalletTotals: vi.fn(),
  getSceneMaterialization: vi.fn(),
  insertSceneMaterializationIfAbsent: vi.fn(),
}));

const catalogMocks = vi.hoisted(() => ({
  loadContentCatalog: vi.fn(),
  findCatalogQuest: vi.fn(),
  findCatalogScene: vi.fn(),
}));

vi.mock("@/lib/game/repositories/game-progress-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/game/repositories/game-progress-repository")>();
  return {
    ...actual,
    ensureWalletRow: repoMocks.ensureWalletRow,
    getActiveQuestRun: repoMocks.getActiveQuestRun,
    getCompletedQuestIds: repoMocks.getCompletedQuestIds,
    getCompletedSceneIds: repoMocks.getCompletedSceneIds,
    getWalletTotals: repoMocks.getWalletTotals,
    getSceneMaterialization: repoMocks.getSceneMaterialization,
    insertSceneMaterializationIfAbsent: repoMocks.insertSceneMaterializationIfAbsent,
  };
});

vi.mock("@/lib/game/content/catalog-loader", () => catalogMocks);

import { getRunSnapshot } from "@/lib/game/services/game-progress-service";

const matchingScene = {
  id: "chapter-01-quest-01-bonus-scene-02",
  sceneNumber: 2,
  filename: "02.json",
  scene_type: "task" as const,
  screen_type: "matching" as const,
  background: "bg",
  content: {
    title: "Bonus",
    task: {
      leftItems: [{ id: "left_a", label: "ciao" }],
      rightItems: [{ id: "right_a", label: "hello" }],
      correctPairs: [{ leftItemId: "left_a", rightItemId: "right_a" }],
    },
  },
  scoring: {
    backpack: { pieces: 1 },
    pizza: { mode: "scored" as const, maxSlices: 3, minRatioToComplete: 0.6, rounding: "floor" as const, mapping: { kind: "linear" as const } },
  },
};

describe("getRunSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoMocks.ensureWalletRow.mockResolvedValue(true);
    repoMocks.getWalletTotals.mockResolvedValue({ totalSlices: 0, totalBackpackPieces: 0 });
    repoMocks.getActiveQuestRun.mockResolvedValue(null);
    repoMocks.getCompletedSceneIds.mockResolvedValue([]);
    repoMocks.getSceneMaterialization.mockResolvedValue({ ok: true, materializedTask: null });
    repoMocks.insertSceneMaterializationIfAbsent.mockResolvedValue(true);
  });

  it("returns no run when there is no active in-progress quest", async () => {
    const result = await getRunSnapshot("acc-1");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.run).toBeNull();
  });

  it("rejects snapshot for in-progress run in manually locked chapter", async () => {
    repoMocks.getActiveQuestRun.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-01",
      currentSceneId: "chapter-03-quest-01-scene-01",
      status: "in_progress" as const,
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({
      chapters: [{ id: "chapter-03", locked: true, questsExpanded: [] }],
    });

    const result = await getRunSnapshot("acc-1");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("chapter_locked");
  });

  it("returns materialization_failed when matching pool cannot be resolved", async () => {
    const activeRun = {
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-01",
      questId: "quest-01-bonus",
      currentSceneId: "chapter-01-quest-01-bonus-scene-02",
      status: "in_progress" as const,
    };
    repoMocks.getActiveQuestRun.mockResolvedValue(activeRun);
    repoMocks.getCompletedQuestIds.mockResolvedValue([]);
    catalogMocks.loadContentCatalog.mockResolvedValue({ chapters: [{ id: "chapter-01", questsExpanded: [] }] });
    catalogMocks.findCatalogQuest.mockReturnValue({ scenes: [matchingScene] });
    catalogMocks.findCatalogScene.mockReturnValue({
      ...matchingScene,
      content: {
        title: "Bonus",
        task: {
          sampleSize: 2,
          poolPairs: [{ id: "bad", leftLabel: "", rightLabel: "" }],
        },
      },
    });

    const result = await getRunSnapshot("acc-1");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("materialization_failed");
  });
});
