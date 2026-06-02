import { beforeEach, describe, expect, it, vi } from "vitest";

const repoMocks = vi.hoisted(() => ({
  completeQuestRun: vi.fn(),
  completeSceneOnce: vi.fn(),
  createQuestRun: vi.fn(),
  ensureWalletRow: vi.fn(),
  getActiveQuestRun: vi.fn(),
  getCompletedQuestIds: vi.fn(),
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
    repoMocks.getCompletedQuestIds.mockResolvedValue([]);
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

  it("rejects quest start when previous chapter is not completed", async () => {
    repoMocks.getActiveQuestRun.mockResolvedValue(null);
    catalogMocks.loadContentCatalog.mockResolvedValue({
      chapters: [
        {
          id: "chapter-01",
          questsExpanded: [
            { id: "quest-01", kind: "main" },
            { id: "quest-02", kind: "main" },
          ],
        },
        {
          id: "chapter-02",
          questsExpanded: [{ id: "quest-01", kind: "main" }],
        },
      ],
    });
    catalogMocks.findCatalogQuest.mockReturnValue({
      id: "quest-01",
      requiresQuestId: null,
      scenes: [{ id: "chapter-02-quest-01-scene-01" }],
    });
    repoMocks.getCompletedQuestIds.mockResolvedValue(["quest-01"]);

    const result = await startOrResumeRun("acc-1", "chapter-02", "quest-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.code).toBe("quest_locked");
    }
    expect(repoMocks.createQuestRun).not.toHaveBeenCalled();
  });

  it("rejects quest start when required quest is incomplete", async () => {
    repoMocks.getActiveQuestRun.mockResolvedValue(null);
    catalogMocks.loadContentCatalog.mockResolvedValue({
      chapters: [
        {
          id: "chapter-01",
          questsExpanded: [
            { id: "quest-01", kind: "main" },
            { id: "quest-02", kind: "main" },
          ],
        },
      ],
    });
    catalogMocks.findCatalogQuest.mockReturnValue({
      id: "quest-02",
      requiresQuestId: "quest-01",
      scenes: [{ id: "chapter-01-quest-02-scene-01" }],
    });
    repoMocks.getCompletedQuestIds.mockResolvedValue([]);

    const result = await startOrResumeRun("acc-1", "chapter-01", "quest-02");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.code).toBe("quest_locked");
    }
    expect(repoMocks.createQuestRun).not.toHaveBeenCalled();
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

  it("rejects scored free_text tasks without evaluator", async () => {
    repoMocks.getQuestRunById.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-02",
      currentSceneId: "chapter-03-quest-02-scene-02",
      status: "in_progress",
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({});
    catalogMocks.findCatalogScene.mockReturnValue({
      id: "chapter-03-quest-02-scene-02",
      sceneNumber: 2,
      filename: "02.json",
      scene_type: "task",
      screen_type: "free_text",
      background: "chapters/03/quests/02/bg-task-01",
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

    const result = await completeTaskScene("acc-1", "run-1", "chapter-03-quest-02-scene-02", {
      attemptPayload: { rawText: "ciao" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(501);
      expect(result.code).toBe("task_eval_not_implemented");
    }
  });
});
