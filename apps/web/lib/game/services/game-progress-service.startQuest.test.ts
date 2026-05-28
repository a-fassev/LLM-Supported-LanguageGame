import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureWalletRow: vi.fn(),
  getQuestById: vi.fn(),
  listActiveChaptersOrdered: vi.fn(),
  listActiveQuestsByChapterIds: vi.fn(),
  getWalletTotals: vi.fn(),
  listCompletedQuestIds: vi.fn(),
  listCompletedLogicalTaskKeys: vi.fn(),
  findInProgressRun: vi.fn(),
  abandonAllInProgressRunsForAccount: vi.fn(),
  insertRun: vi.fn(),
  listStepsForQuest: vi.fn(),
  hasCompletedQuest: vi.fn(),
  getStepMaterialization: vi.fn(),
  upsertStepMaterialization: vi.fn(),
}));

vi.mock("@/lib/game/repositories/game-progress-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/game/repositories/game-progress-repository")>();
  return {
    ...actual,
    ensureWalletRow: mocks.ensureWalletRow,
    getQuestById: mocks.getQuestById,
    listActiveChaptersOrdered: mocks.listActiveChaptersOrdered,
    listActiveQuestsByChapterIds: mocks.listActiveQuestsByChapterIds,
    getWalletTotals: mocks.getWalletTotals,
    listCompletedQuestIds: mocks.listCompletedQuestIds,
    listCompletedLogicalTaskKeys: mocks.listCompletedLogicalTaskKeys,
    findInProgressRun: mocks.findInProgressRun,
    abandonAllInProgressRunsForAccount: mocks.abandonAllInProgressRunsForAccount,
    insertRun: mocks.insertRun,
    listStepsForQuest: mocks.listStepsForQuest,
    hasCompletedQuest: mocks.hasCompletedQuest,
    getStepMaterialization: mocks.getStepMaterialization,
    upsertStepMaterialization: mocks.upsertStepMaterialization,
  };
});

import { startOrResumeQuest } from "@/lib/game/services/game-progress-service";

const accountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const chapterId = "11111111-1111-4111-8111-111111111111";
const questId = "22222222-2222-4222-8222-222222222222";
const runId = "33333333-3333-4333-8333-333333333333";

function seedBase() {
  mocks.ensureWalletRow.mockResolvedValue(true);
  mocks.getQuestById.mockResolvedValue({
    id: questId,
    chapter_id: chapterId,
    slug: "chapter-01-quest-04-bonus-vocab",
    display_name: "Bonus",
    order_index: 3,
    unlock_rules: { requiredTotalSlices: 0, prerequisiteQuestSlugs: [], prerequisiteLogicalTaskKeys: [] },
    meta_payload: { flow: { blockBack: false } },
    is_active: true,
  });
  mocks.listActiveChaptersOrdered.mockResolvedValue([
    { id: chapterId, slug: "chapter-01", display_name: "Chapter 1", order_index: 0, theme_payload: {}, is_active: true },
  ]);
  mocks.listActiveQuestsByChapterIds.mockResolvedValue([
    {
      id: questId,
      chapter_id: chapterId,
      slug: "chapter-01-quest-04-bonus-vocab",
      display_name: "Bonus",
      order_index: 3,
      unlock_rules: { requiredTotalSlices: 0, prerequisiteQuestSlugs: [], prerequisiteLogicalTaskKeys: [] },
      meta_payload: { flow: { blockBack: false } },
      is_active: true,
    },
  ]);
  mocks.getWalletTotals.mockResolvedValue({ totalSlices: 0, totalBackpackPieces: 0 });
  mocks.listCompletedQuestIds.mockResolvedValue([]);
  mocks.listCompletedLogicalTaskKeys.mockResolvedValue([]);
  mocks.findInProgressRun.mockResolvedValue(null);
  mocks.abandonAllInProgressRunsForAccount.mockResolvedValue(true);
  mocks.insertRun.mockResolvedValue({
    id: runId,
    account_id: accountId,
    chapter_id: chapterId,
    quest_id: questId,
    status: "in_progress",
    current_step_order_index: 0,
    current_task_order_index: 0,
    started_at: new Date().toISOString(),
    completed_at: null,
  });
  mocks.hasCompletedQuest.mockResolvedValue(false);
  mocks.getStepMaterialization.mockResolvedValue(null);
  mocks.upsertStepMaterialization.mockImplementation(
    async (_accountId: string, _runId: string, _stepId: string, payload: Record<string, unknown>) => ({
      id: "mat",
      account_id: accountId,
      run_id: runId,
      step_id: "step-1",
      materialized_content_payload: payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  );
}

describe("startOrResumeQuest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedBase();
  });

  it("rejects starting an already-completed quest", async () => {
    mocks.listCompletedQuestIds.mockResolvedValue([questId]);
    const result = await startOrResumeQuest(accountId, questId);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("quest_already_completed");
  });

  it("resumes in-progress run for same quest", async () => {
    mocks.findInProgressRun.mockResolvedValue({
      id: runId,
      account_id: accountId,
      chapter_id: chapterId,
      quest_id: questId,
      status: "in_progress",
      current_step_order_index: 0,
      current_task_order_index: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
    });
    mocks.listStepsForQuest.mockResolvedValue([
      {
        id: "step-0",
        quest_id: questId,
        order_index: 0,
        step_kind: "cutscene",
        task_type: null,
        template_key: "cutscene.stub",
        logical_task_key: "logical-cut",
        content_payload: {
          sceneBackgroundAsset: "static/cutscene-backgrounds/chapter-01/ph-cs-bonus-neutral",
          beats: [{ presentationMode: "narrator", body: "Ciao." }],
        },
        reward_rules: {},
        is_active: true,
      },
    ]);

    const result = await startOrResumeQuest(accountId, questId);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.runId).toBe(runId);
    expect(mocks.insertRun).not.toHaveBeenCalled();
  });

  it("materializes matching pool payload into concrete pairs", async () => {
    mocks.listStepsForQuest.mockResolvedValue([
      {
        id: "step-1",
        quest_id: questId,
        order_index: 1,
        step_kind: "task",
        task_type: "Matching",
        template_key: "task.matching",
        logical_task_key: "bonus-matching",
        content_payload: {
          sceneBackgroundAsset: "static/task-scene-backgrounds/chapter-01/ph-ts-bonus-neutral",
          prompt: "Match",
          sampleSize: 2,
          poolPairs: [
            { id: "a", leftLabel: "ciao", rightLabel: "hello" },
            { id: "b", leftLabel: "grazie", rightLabel: "thanks" },
            { id: "c", leftLabel: "mare", rightLabel: "sea" },
          ],
        },
        reward_rules: {},
        is_active: true,
      },
    ]);

    const result = await startOrResumeQuest(accountId, questId);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    const step = result.steps[0];
    expect(step).toBeDefined();
    const payload = JSON.parse(step!.contentJson) as {
      leftItems: unknown[];
      rightItems: unknown[];
      correctPairs: unknown[];
    };
    expect(payload.leftItems).toHaveLength(2);
    expect(payload.rightItems).toHaveLength(2);
    expect(payload.correctPairs).toHaveLength(2);
  });

  it("rejects starting a later quest when previous chapter quest is incomplete", async () => {
    const firstQuestId = "11111111-2222-4333-8444-555555555555";
    mocks.listActiveQuestsByChapterIds.mockResolvedValue([
      {
        id: firstQuestId,
        chapter_id: chapterId,
        slug: "chapter-01-quest-03-bar",
        display_name: "Bar",
        order_index: 2,
        unlock_rules: { requiredTotalSlices: 0, prerequisiteQuestSlugs: [], prerequisiteLogicalTaskKeys: [] },
        meta_payload: {},
        is_active: true,
      },
      {
        id: questId,
        chapter_id: chapterId,
        slug: "chapter-01-quest-04-bonus-vocab",
        display_name: "Bonus",
        order_index: 3,
        unlock_rules: { requiredTotalSlices: 0, prerequisiteQuestSlugs: [], prerequisiteLogicalTaskKeys: [] },
        meta_payload: { flow: { blockBack: false } },
        is_active: true,
      },
    ]);
    mocks.listCompletedQuestIds.mockResolvedValue([]);

    const result = await startOrResumeQuest(accountId, questId);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected lock");
    expect(result.code).toBe("quest_locked");
  });
});
