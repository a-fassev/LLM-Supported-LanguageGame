import { beforeEach, describe, expect, it, vi } from "vitest";

const repoMocks = vi.hoisted(() => ({
  ensureWalletRow: vi.fn(),
  getActiveQuestRun: vi.fn(),
  getCompletedQuestIds: vi.fn(),
  getCompletedSceneIds: vi.fn(),
  getRecentCompletedQuestRuns: vi.fn(),
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
    getRecentCompletedQuestRuns: repoMocks.getRecentCompletedQuestRuns,
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
    repoMocks.getSceneMaterialization.mockResolvedValue(null);
    repoMocks.insertSceneMaterializationIfAbsent.mockResolvedValue(true);
  });

  it("restores a completed main run when bonus auto-start is still pending", async () => {
    const completedMain = {
      runId: "run-main",
      accountId: "acc-1",
      chapterId: "chapter-01",
      questId: "quest-02",
      currentSceneId: "chapter-01-quest-02-scene-02",
      status: "completed" as const,
    };
    repoMocks.getRecentCompletedQuestRuns.mockResolvedValue([completedMain]);
    repoMocks.getCompletedQuestIds.mockResolvedValue(["chapter-01:quest-01", "chapter-01:quest-02"]);
    catalogMocks.loadContentCatalog.mockResolvedValue({
      chapters: [
        {
          id: "chapter-01",
          questsExpanded: [
            { id: "quest-02", kind: "main", autoStartQuestId: "quest-01-bonus", scenes: [matchingScene] },
            { id: "quest-01-bonus", kind: "bonus", requiresQuestId: "quest-02", scenes: [matchingScene] },
          ],
        },
      ],
    });
    catalogMocks.findCatalogQuest.mockImplementation(
      (_catalog: unknown, _chapterId: string, questId: string) => {
        if (questId === "quest-02") {
          return {
            id: "quest-02",
            autoStartQuestId: "quest-01-bonus",
            scenes: [matchingScene],
          };
        }
        return {
          id: "quest-01-bonus",
          requiresQuestId: "quest-02",
          scenes: [matchingScene],
        };
      },
    );
    catalogMocks.findCatalogScene.mockReturnValue(matchingScene);

    const result = await getRunSnapshot("acc-1");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.run?.status).toBe("completed");
    expect(result.run?.autoStartQuest).toEqual({ chapterId: "chapter-01", questId: "quest-01-bonus" });
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
