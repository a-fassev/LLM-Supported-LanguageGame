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
  getSceneMaterialization: vi.fn(),
  insertSceneMaterializationIfAbsent: vi.fn(),
}));

const catalogMocks = vi.hoisted(() => ({
  loadContentCatalog: vi.fn(),
  findCatalogQuest: vi.fn(),
  findCatalogScene: vi.fn(),
}));

const evaluateFreitextLlmSceneMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/game/repositories/game-progress-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/game/repositories/game-progress-repository")>();
  return {
    ...actual,
    completeQuestRun: repoMocks.completeQuestRun,
    completeSceneOnce: repoMocks.completeSceneOnce,
    createQuestRun: repoMocks.createQuestRun,
    ensureWalletRow: repoMocks.ensureWalletRow,
    getActiveQuestRun: repoMocks.getActiveQuestRun,
    getCompletedQuestIds: repoMocks.getCompletedQuestIds,
    getCompletedSceneIds: repoMocks.getCompletedSceneIds,
    getQuestRunById: repoMocks.getQuestRunById,
    getWalletTotals: repoMocks.getWalletTotals,
    incrementWalletTotals: repoMocks.incrementWalletTotals,
    updateQuestRunPosition: repoMocks.updateQuestRunPosition,
    getSceneMaterialization: repoMocks.getSceneMaterialization,
    insertSceneMaterializationIfAbsent: repoMocks.insertSceneMaterializationIfAbsent,
  };
});
vi.mock("@/lib/game/content/catalog-loader", () => catalogMocks);
vi.mock("@/lib/game/tasks/freitext/evaluate-freitext-llm-scene", () => ({
  evaluateFreitextLlmScene: evaluateFreitextLlmSceneMock,
}));

function makePoolMatchingTaskScene() {
  return {
    id: "chapter-00-quest-01-bonus-scene-02",
    sceneNumber: 2,
    filename: "02.json",
    scene_type: "task" as const,
    screen_type: "matching" as const,
    background: "chapters/00/quests/bonus/bg-task-01",
    content: {
      title: "Sfida bonus",
      task: {
        prompt: "Abbina",
        sampleSize: 2,
        poolPairs: [
          { id: "a", leftLabel: "ciao", rightLabel: "hello" },
          { id: "b", leftLabel: "grazie", rightLabel: "thanks" },
          { id: "c", leftLabel: "notte", rightLabel: "night" },
        ],
      },
    },
    scoring: {
      backpack: { pieces: 1 },
      pizza: {
        mode: "scored" as const,
        maxSlices: 3,
        minRatioToComplete: 1,
        rounding: "floor" as const,
        mapping: { kind: "linear" as const },
      },
    },
  };
}

const persistedPoolMatchingTask = {
  leftItems: [
    { id: "left_a", label: "ciao" },
    { id: "left_b", label: "grazie" },
  ],
  rightItems: [
    { id: "right_a", label: "hello" },
    { id: "right_b", label: "thanks" },
  ],
  correctPairs: [
    { leftItemId: "left_a", rightItemId: "right_a" },
    { leftItemId: "left_b", rightItemId: "right_b" },
  ],
};

function makeFreetextTaskScene() {
  return {
    id: "chapter-03-quest-02-scene-02",
    sceneNumber: 2,
    filename: "02.json",
    scene_type: "task" as const,
    screen_type: "free_text" as const,
    background: "chapters/03/quests/02/bg-task-01",
    content: {
      title: "Task",
      instruction: "Scrivi due frasi.",
      task: {
        prompt: "Descrivi.",
        evaluation: {
          grammarWeight: 1,
          vocabularyWeight: 1,
          registerWeight: 1,
          passThreshold: 0.5,
        },
      },
    },
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
}

import {
  completeTaskScene,
  retreatRunScene,
  startOrResumeRun,
} from "@/lib/game/services/game-progress-service";

describe("game-progress-service run flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    repoMocks.ensureWalletRow.mockResolvedValue(true);
    repoMocks.getWalletTotals.mockResolvedValue({ totalSlices: 0, totalBackpackPieces: 0 });
    repoMocks.getCompletedQuestIds.mockResolvedValue([]);
    repoMocks.getSceneMaterialization.mockResolvedValue({ ok: true, materializedTask: null });
    repoMocks.insertSceneMaterializationIfAbsent.mockResolvedValue(true);
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

  it("rejects quest start when chapter is manually locked", async () => {
    repoMocks.getActiveQuestRun.mockResolvedValue(null);
    catalogMocks.loadContentCatalog.mockResolvedValue({
      chapters: [
        {
          id: "chapter-03",
          locked: true,
          questsExpanded: [{ id: "quest-01", kind: "main" }],
        },
      ],
    });
    catalogMocks.findCatalogQuest.mockReturnValue({
      id: "quest-01",
      requiresQuestId: null,
      scenes: [{ id: "chapter-03-quest-01-scene-01" }],
    });
    repoMocks.getCompletedQuestIds.mockResolvedValue([
      "chapter-01:quest-01",
      "chapter-01:quest-02",
      "chapter-02:quest-01",
      "chapter-02:quest-02",
    ]);

    const result = await startOrResumeRun("acc-1", "chapter-03", "quest-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.code).toBe("chapter_locked");
    }
    expect(repoMocks.createQuestRun).not.toHaveBeenCalled();
  });

  it("rejects resume when chapter is manually locked", async () => {
    repoMocks.getActiveQuestRun.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-01",
      currentSceneId: "chapter-03-quest-01-scene-01",
      status: "in_progress",
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({
      chapters: [
        {
          id: "chapter-03",
          locked: true,
          questsExpanded: [{ id: "quest-01", kind: "main" }],
        },
      ],
    });

    const result = await startOrResumeRun("acc-1", "chapter-03", "quest-01");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.code).toBe("chapter_locked");
    }
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

  it("completes scored pool matching when attempt matches materialized correctPairs", async () => {
    const taskScene = makePoolMatchingTaskScene();
    const run = {
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-00",
      questId: "quest-01-bonus",
      currentSceneId: taskScene.id,
      status: "in_progress" as const,
    };
    const nextScene = {
      id: "chapter-00-quest-01-bonus-scene-03",
      sceneNumber: 3,
      filename: "03.json",
      scene_type: "story" as const,
      screen_type: "info" as const,
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
          id: "chapter-00",
          questsExpanded: [{ id: "quest-01-bonus", scenes: [taskScene, nextScene] }],
        },
      ],
    });
    catalogMocks.findCatalogScene.mockImplementation((_catalog, _ch, _q, sceneId: string) => {
      if (sceneId === taskScene.id) return taskScene;
      if (sceneId === nextScene.id) return nextScene;
      return null;
    });
    catalogMocks.findCatalogQuest.mockReturnValue({
      id: "quest-01-bonus",
      scenes: [taskScene, nextScene],
    });
    repoMocks.getSceneMaterialization.mockResolvedValue({
      ok: true,
      materializedTask: persistedPoolMatchingTask,
    });
    repoMocks.completeSceneOnce.mockResolvedValue({ completionId: "c1", inserted: true });
    repoMocks.incrementWalletTotals.mockResolvedValue(true);
    repoMocks.updateQuestRunPosition.mockResolvedValue(true);
    repoMocks.getCompletedSceneIds.mockResolvedValue([taskScene.id]);
    repoMocks.getWalletTotals.mockResolvedValue({ totalSlices: 3, totalBackpackPieces: 1 });

    const result = await completeTaskScene("acc-1", "run-1", taskScene.id, {
      attemptPayload: {
        taskType: "Matching",
        matching: { pairs: { left_a: "right_a", left_b: "right_b" } },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.taskOutcome?.ratio).toBe(1);
    }
    expect(repoMocks.completeSceneOnce).toHaveBeenCalled();
    expect(repoMocks.insertSceneMaterializationIfAbsent).not.toHaveBeenCalled();
  });

  it("rejects scored pool matching below minRatioToComplete", async () => {
    const taskScene = makePoolMatchingTaskScene();
    repoMocks.getQuestRunById.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-00",
      questId: "quest-01-bonus",
      currentSceneId: taskScene.id,
      status: "in_progress",
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({});
    catalogMocks.findCatalogScene.mockReturnValue(taskScene);
    repoMocks.getSceneMaterialization.mockResolvedValue({
      ok: true,
      materializedTask: persistedPoolMatchingTask,
    });

    const result = await completeTaskScene("acc-1", "run-1", taskScene.id, {
      attemptPayload: {
        taskType: "Matching",
        matching: { pairs: { left_a: "right_a", left_b: "right_wrong" } },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.code).toBe("task_min_ratio_not_met");
      expect(result.taskOutcome?.kind).toBe("retry");
    }
    expect(repoMocks.completeSceneOnce).not.toHaveBeenCalled();
  });

  it("returns materialization_failed when pool matching row cannot be read", async () => {
    const taskScene = makePoolMatchingTaskScene();
    repoMocks.getQuestRunById.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-00",
      questId: "quest-01-bonus",
      currentSceneId: taskScene.id,
      status: "in_progress",
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({});
    catalogMocks.findCatalogScene.mockReturnValue(taskScene);
    repoMocks.getSceneMaterialization.mockResolvedValue({ ok: false });

    const result = await completeTaskScene("acc-1", "run-1", taskScene.id, {
      attemptPayload: {
        taskType: "Matching",
        matching: { pairs: { left_a: "right_a" } },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(500);
      expect(result.code).toBe("materialization_failed");
    }
  });

  it("returns evaluator_unavailable for free_text when LLM env is missing", async () => {
    const taskScene = makeFreetextTaskScene();
    repoMocks.getQuestRunById.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-02",
      currentSceneId: taskScene.id,
      status: "in_progress",
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({});
    catalogMocks.findCatalogScene.mockReturnValue(taskScene);
    evaluateFreitextLlmSceneMock.mockResolvedValue({
      ok: false,
      status: 503,
      error: "Il valutatore non è disponibile. Riprova più tardi.",
      code: "evaluator_unavailable",
    });

    const result = await completeTaskScene("acc-1", "run-1", taskScene.id, {
      attemptPayload: {
        taskType: "FreitextLlm",
        freitextLlm: { answerText: "Ciao, mi chiamo Luca." },
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(503);
      expect(result.code).toBe("evaluator_unavailable");
    }
    expect(evaluateFreitextLlmSceneMock).toHaveBeenCalled();
  });

  it("evaluates free_text when pizza mode is flat", async () => {
    const taskScene = {
      ...makeFreetextTaskScene(),
      scoring: {
        backpack: { pieces: 1 },
        pizza: { mode: "flat" as const, slices: 2 },
      },
    };
    const run = {
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-02",
      currentSceneId: taskScene.id,
      status: "in_progress" as const,
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
    repoMocks.getWalletTotals.mockResolvedValue({ totalSlices: 2, totalBackpackPieces: 1 });
    evaluateFreitextLlmSceneMock.mockResolvedValue({
      ok: true,
      ratio: 0.9,
      feedback: { summaryFeedback: "Ottimo!" },
    });

    const result = await completeTaskScene("acc-1", "run-1", taskScene.id, {
      attemptPayload: {
        taskType: "FreitextLlm",
        freitextLlm: { answerText: "Ciao, mi chiamo Luca. Piacere." },
      },
    });

    expect(result.ok).toBe(true);
    expect(evaluateFreitextLlmSceneMock).toHaveBeenCalled();
    if (result.ok) {
      expect(result.taskOutcome?.awardedSlices).toBe(2);
    }
  });

  it("rejects free_text below passThreshold when pizza mode is flat", async () => {
    const taskScene = {
      ...makeFreetextTaskScene(),
      scoring: {
        backpack: { pieces: 0 },
        pizza: { mode: "flat" as const, slices: 2 },
      },
    };
    repoMocks.getQuestRunById.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-02",
      currentSceneId: taskScene.id,
      status: "in_progress",
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({});
    catalogMocks.findCatalogScene.mockReturnValue(taskScene);
    evaluateFreitextLlmSceneMock.mockResolvedValue({
      ok: true,
      ratio: 0.4,
      feedback: { summaryFeedback: "Aggiungi un saluto." },
    });

    const result = await completeTaskScene("acc-1", "run-1", taskScene.id, {
      attemptPayload: {
        taskType: "FreitextLlm",
        freitextLlm: { answerText: "Ciao." },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.code).toBe("task_min_ratio_not_met");
      expect(result.taskOutcome?.kind).toBe("retry");
      expect(result.taskOutcome?.body).toContain("saluto");
    }
    expect(evaluateFreitextLlmSceneMock).toHaveBeenCalled();
    expect(repoMocks.completeSceneOnce).not.toHaveBeenCalled();
  });

  it("rejects scored free_text below minRatioToComplete with retry taskOutcome", async () => {
    const taskScene = makeFreetextTaskScene();
    repoMocks.getQuestRunById.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-02",
      currentSceneId: taskScene.id,
      status: "in_progress",
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({});
    catalogMocks.findCatalogScene.mockReturnValue(taskScene);
    evaluateFreitextLlmSceneMock.mockResolvedValue({
      ok: true,
      ratio: 0.65,
      feedback: {
        summaryFeedback: "Aggiungi più dettagli.",
        nextStepAdvice: "Nomina un prodotto dal menu.",
      },
    });

    const result = await completeTaskScene("acc-1", "run-1", taskScene.id, {
      attemptPayload: {
        taskType: "FreitextLlm",
        freitextLlm: { answerText: "Vorrei un caffe per favore." },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.code).toBe("task_min_ratio_not_met");
      expect(result.taskOutcome?.kind).toBe("retry");
      expect(result.taskOutcome?.body).toContain("dettagli");
    }
    expect(evaluateFreitextLlmSceneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceDocument: undefined,
      }),
      expect.anything(),
    );
    expect(repoMocks.completeSceneOnce).not.toHaveBeenCalled();
  });

  it("passes shell referenceDocument into free_text evaluation", async () => {
    const taskScene = {
      ...makeFreetextTaskScene(),
      content: {
        ...makeFreetextTaskScene().content,
        referenceDocument: { title: "Menu", body: "Cappuccino - 1,50 EUR" },
      },
    };
    repoMocks.getQuestRunById.mockResolvedValue({
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-02",
      currentSceneId: taskScene.id,
      status: "in_progress",
    });
    catalogMocks.loadContentCatalog.mockResolvedValue({});
    catalogMocks.findCatalogScene.mockReturnValue(taskScene);
    evaluateFreitextLlmSceneMock.mockResolvedValue({
      ok: false,
      status: 503,
      error: "unavailable",
      code: "evaluator_unavailable",
    });

    await completeTaskScene("acc-1", "run-1", taskScene.id, {
      attemptPayload: {
        taskType: "FreitextLlm",
        freitextLlm: { answerText: "Vorrei un cappuccino." },
      },
    });

    expect(evaluateFreitextLlmSceneMock).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceDocument: { title: "Menu", body: "Cappuccino - 1,50 EUR" },
      }),
      expect.anything(),
    );
  });

  it("skips free_text LLM when GAME_SMOKE_AUTO_PASS is true", async () => {
    vi.stubEnv("GAME_SMOKE_AUTO_PASS", "true");

    const taskScene = makeFreetextTaskScene();
    const run = {
      runId: "run-1",
      accountId: "acc-1",
      chapterId: "chapter-03",
      questId: "quest-02",
      currentSceneId: taskScene.id,
      status: "in_progress" as const,
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
      attemptPayload: {
        taskType: "FreitextLlm",
        freitextLlm: { answerText: "Ciao, mi chiamo Luca. Piacere di conoscerti." },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.taskOutcome?.ratio).toBe(1);
      expect(result.taskOutcome?.awardedSlices).toBeGreaterThan(0);
    }
    expect(evaluateFreitextLlmSceneMock).not.toHaveBeenCalled();
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
      background: "chapters/01/quests/01/bg-scene-01",
      content: { text: "One" },
      scoring: { backpack: { pieces: 0 }, pizza: { mode: "flat" as const, slices: 0 } },
    };
    const scene2 = {
      id: "chapter-01-quest-01-scene-02",
      sceneNumber: 2,
      filename: "02.json",
      scene_type: "story" as const,
      screen_type: "info",
      background: "chapters/01/quests/01/bg-scene-02",
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
      expect(result.run.nextSceneBackground).toBe(scene2.background);
    }
  });
});
