import { beforeEach, describe, expect, it, vi } from "vitest";

const repoMocks = vi.hoisted(() => ({
  completeQuestRun: vi.fn(),
  completeSceneOnce: vi.fn(),
  createQuestRun: vi.fn(),
  ensureWalletRow: vi.fn(),
  getActiveQuestRun: vi.fn(),
  getCompletedSceneIds: vi.fn(),
  getQuestRunById: vi.fn(),
  getWalletTotals: vi.fn(),
  incrementWalletTotals: vi.fn(),
  updateQuestRunPosition: vi.fn(),
}));

const catalogMocks = vi.hoisted(() => ({
  loadContentCatalog: vi.fn(),
  findCatalogQuest: vi.fn(),
  findCatalogScene: vi.fn(),
}));

vi.mock("@/lib/game/repositories/game-progress-repository", () => repoMocks);
vi.mock("@/lib/game/content/catalog-loader", () => catalogMocks);

import { completeTaskScene, startOrResumeRun } from "@/lib/game/services/game-progress-service";

describe("game-progress-service run flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoMocks.ensureWalletRow.mockResolvedValue(true);
    repoMocks.getWalletTotals.mockResolvedValue({ totalSlices: 0, totalBackpackPieces: 0 });
  });

  it("returns conflict when another run is already active", async () => {
    repoMocks.getActiveQuestRun.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-01",
      questId: "quest-01",
      currentSceneId: "chapter-01-quest-01-scene-01",
      status: "in_progress",
    });

    const result = await startOrResumeRun("acc-1", "chapter-02", "quest-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.code).toBe("active_run_exists");
    }
  });

  it("rejects scored task completion without server-evaluable attempt", async () => {
    repoMocks.getQuestRunById.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-01",
      questId: "quest-01",
      currentSceneId: "chapter-01-quest-01-scene-02",
      status: "in_progress",
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({});
    catalogMocks.findCatalogScene.mockReturnValue({
      id: "chapter-01-quest-01-scene-02",
      sceneNumber: 2,
      filename: "02.json",
      scene_type: "task",
      screen_type: "multiple_choice",
      background: "chapters/01/quests/01/bg-task-01",
      content: {
        title: "Task",
        task: {},
      },
      scoring: {
        backpack: { pieces: 1 },
        pizza: {
          mode: "scored",
          maxSlices: 3,
          mapping: { kind: "linear" },
        },
      },
    });

    const result = await completeTaskScene("acc-1", "run-1", "chapter-01-quest-01-scene-02", {
      attemptPayload: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.code).toBe("attempt_invalid");
    }
    expect(repoMocks.completeSceneOnce).not.toHaveBeenCalled();
    expect(repoMocks.incrementWalletTotals).not.toHaveBeenCalled();
  });
});
