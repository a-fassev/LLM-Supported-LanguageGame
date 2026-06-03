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

import {
  completeTaskScene,
  retreatRunScene,
  startOrResumeRun,
} from "@/lib/game/services/game-progress-service";

describe("game-progress-service run flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoMocks.ensureWalletRow.mockResolvedValue(true);
    repoMocks.getWalletTotals.mockResolvedValue({ totalSlices: 0, totalBackpackPieces: 0 });
    repoMocks.getCompletedQuestIds.mockResolvedValue([]);
  });

  it("resumes same quest when create races on active-run unique index", async () => {
    const activeRun = {
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-01",
      questId: "quest-01",
      currentSceneId: "chapter-01-quest-01-scene-01",
      status: "in_progress" as const,
    };
    repoMocks.getActiveQuestRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(activeRun);
    repoMocks.createQuestRun.mockResolvedValue(null);
    catalogMocks.loadContentCatalog.mockResolvedValue({
      chapters: [{ id: "chapter-01", questsExpanded: [{ id: "quest-01", kind: "main" }] }],
    });
    catalogMocks.findCatalogQuest.mockReturnValue({
      id: "quest-01",
      requiresQuestId: null,
      scenes: [{ id: "chapter-01-quest-01-scene-01" }],
    });
    catalogMocks.findCatalogScene.mockReturnValue({
      id: "chapter-01-quest-01-scene-01",
      sceneNumber: 1,
      filename: "01.json",
      scene_type: "story",
      screen_type: "info",
      background: "bg",
      content: {},
    });
    repoMocks.getCompletedSceneIds.mockResolvedValue([]);

    const result = await startOrResumeRun("acc-1", "chapter-01", "quest-01");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.run?.runId).toBe("run-1");
    }
    expect(repoMocks.createQuestRun).toHaveBeenCalledTimes(1);
    expect(repoMocks.getActiveQuestRun).toHaveBeenCalledTimes(2);
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
    repoMocks.getCompletedQuestIds.mockResolvedValue(["chapter-01:quest-01"]);

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

  it("auto-passes scored free_text when GAME_SMOKE_AUTO_PASS is true", async () => {
    vi.stubEnv("GAME_SMOKE_AUTO_PASS", "true");

    const run = {
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-02",
      currentSceneId: "chapter-03-quest-02-scene-02",
      status: "in_progress" as const,
    };
    const taskScene = {
      id: "chapter-03-quest-02-scene-02",
      sceneNumber: 2,
      filename: "02.json",
      scene_type: "task" as const,
      screen_type: "free_text",
      background: "chapters/03/quests/02/bg-task-01",
      content: { title: "Task", task: {} },
      scoring: {
        backpack: { pieces: 1 },
        pizza: {
          mode: "scored" as const,
          maxSlices: 3,
          minRatioToComplete: 0.7,
          rounding: "nearest" as const,
          mapping: { kind: "linear" as const },
        },
      },
    };
    const nextScene = {
      id: "chapter-03-quest-02-scene-03",
      sceneNumber: 3,
      filename: "03.json",
      scene_type: "story" as const,
      screen_type: "info",
      background: "bg",
      content: { text: "Fine" },
      scoring: { backpack: { pieces: 0 }, pizza: { mode: "flat" as const, slices: 0 } },
    };

    repoMocks.getQuestRunById
      .mockResolvedValueOnce(run)
      .mockResolvedValueOnce({ ...run, currentSceneId: nextScene.id });
    catalogMocks.loadContentCatalog.mockResolvedValue({
      chapters: [
        {
          id: "chapter-03",
          questsExpanded: [{ id: "quest-02", scenes: [taskScene, nextScene] }],
        },
      ],
    });
    catalogMocks.findCatalogScene.mockImplementation((_catalog, _ch, _q, sceneId: string) => {
      if (sceneId === taskScene.id) return taskScene;
      if (sceneId === nextScene.id) return nextScene;
      return null;
    });
    catalogMocks.findCatalogQuest.mockReturnValue({
      id: "quest-02",
      scenes: [taskScene, nextScene],
    });
    repoMocks.completeSceneOnce.mockResolvedValue({ completionId: "c1", inserted: true });
    repoMocks.incrementWalletTotals.mockResolvedValue(true);
    repoMocks.updateQuestRunPosition.mockResolvedValue(true);
    repoMocks.getCompletedSceneIds.mockResolvedValue([taskScene.id]);
    repoMocks.getWalletTotals.mockResolvedValue({ totalSlices: 3, totalBackpackPieces: 1 });

    const result = await completeTaskScene("acc-1", "run-1", taskScene.id, {
      attemptPayload: { rawText: "wrong on purpose" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.taskOutcome?.ratio).toBe(1);
      expect(result.taskOutcome?.awardedSlices).toBe(3);
    }
    expect(repoMocks.completeSceneOnce).toHaveBeenCalled();
    expect(repoMocks.incrementWalletTotals).toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it("retreats to the previous scene in catalog order", async () => {
    const scene1 = {
      id: "chapter-01-quest-01-scene-01",
      sceneNumber: 1,
      filename: "01.json",
      scene_type: "story" as const,
      screen_type: "info",
      background: "bg",
      content: { text: "One" },
      scoring: { backpack: { pieces: 0 }, pizza: { mode: "flat" as const, slices: 0 } },
    };
    const scene2 = {
      id: "chapter-01-quest-01-scene-02",
      sceneNumber: 2,
      filename: "02.json",
      scene_type: "story" as const,
      screen_type: "dialogue",
      background: "bg",
      content: { text: "Two" },
      scoring: { backpack: { pieces: 0 }, pizza: { mode: "flat" as const, slices: 0 } },
    };
    const run = {
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-01",
      questId: "quest-01",
      currentSceneId: scene2.id,
      status: "in_progress" as const,
    };

    repoMocks.getQuestRunById
      .mockResolvedValueOnce(run)
      .mockResolvedValueOnce({ ...run, currentSceneId: scene1.id });
    catalogMocks.loadContentCatalog.mockResolvedValue({ chapters: [] });
    catalogMocks.findCatalogQuest.mockReturnValue({ id: "quest-01", scenes: [scene1, scene2] });
    catalogMocks.findCatalogScene.mockImplementation((_catalog, _chapterId, _questId, sceneId) => {
      if (sceneId === scene2.id) return scene2;
      if (sceneId === scene1.id) return scene1;
      return null;
    });
    repoMocks.updateQuestRunPosition.mockResolvedValue(true);
    repoMocks.getCompletedSceneIds.mockResolvedValue([]);

    const result = await retreatRunScene("acc-1", "run-1", scene2.id);
    expect(result.ok).toBe(true);
    expect(repoMocks.updateQuestRunPosition).toHaveBeenCalledWith("run-1", scene1.id);
    if (result.ok && result.run) {
      expect(result.run.currentSceneId).toBe(scene1.id);
      expect(result.run.canRetreat).toBe(false);
    }
  });
});
