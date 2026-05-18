import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getQuestRunById: vi.fn(),
  listStepsForQuest: vi.fn(),
  rpcCompleteQuestStepTask: vi.fn(),
}));

vi.mock("@/lib/game/repositories/game-progress-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/game/repositories/game-progress-repository")>();
  return {
    ...actual,
    getQuestRunById: mocks.getQuestRunById,
    listStepsForQuest: mocks.listStepsForQuest,
    rpcCompleteQuestStepTask: mocks.rpcCompleteQuestStepTask,
  };
});

import { completeQuestStepTask } from "./game-progress-service";

const accountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const runId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const stepId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const questId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function baseRun() {
  return {
    id: runId,
    account_id: accountId,
    chapter_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    quest_id: questId,
    status: "in_progress" as const,
    current_step_order_index: 0,
    current_task_order_index: 0,
    started_at: new Date().toISOString(),
    completed_at: null,
  };
}

function mcStep(rewardRules: Record<string, unknown>) {
  return {
    id: stepId,
    quest_id: questId,
    order_index: 0,
    step_kind: "task" as const,
    task_type: "MultipleChoice",
    template_key: "mc",
    logical_task_key: "logical-mc",
    content_payload: {
      selectionMode: "single",
      correctOptionIds: ["x"],
      options: [{ id: "x", label: "1" }],
    },
    reward_rules: rewardRules,
    is_active: true,
  };
}

const rpcOk = {
  ok: true as const,
  awardedSlices: 0,
  totalSlices: 0,
  totalBackpackPieces: 0,
  awardedBackpackPieces: 0,
  questComplete: false,
  currentTaskOrderIndex: 1,
  currentStepOrderIndex: 1,
  nextTaskStepId: null as string | null,
};

describe("completeQuestStepTask (scored pizza + RPC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQuestRunById.mockResolvedValue(baseRun());
    mocks.listStepsForQuest.mockResolvedValue([
      mcStep({
        pizza: {
          mode: "scored",
          maxSlices: 5,
          minRatioToComplete: 0,
          rounding: "floor",
          mapping: { kind: "linear" },
        },
      }),
    ]);
    mocks.rpcCompleteQuestStepTask.mockResolvedValue({ ...rpcOk, awardedSlices: 0 });
  });

  it("passes computed integer slices to RPC for partial multiple-choice", async () => {
    const result = await completeQuestStepTask(accountId, runId, stepId, {
      attempt: { taskType: "MultipleChoice", multipleChoice: { selections: [[]] } },
    });
    expect(result.ok).toBe(true);
    expect(mocks.rpcCompleteQuestStepTask).toHaveBeenCalledWith(accountId, runId, stepId, 0);
  });

  it("awards max linear slices when all questions correct", async () => {
    const result = await completeQuestStepTask(accountId, runId, stepId, {
      attempt: { taskType: "MultipleChoice", multipleChoice: { selections: [["x"]] } },
    });
    expect(result.ok).toBe(true);
    expect(mocks.rpcCompleteQuestStepTask).toHaveBeenCalledWith(accountId, runId, stepId, 5);
  });

  it("rejects completion below minRatioToComplete without calling RPC", async () => {
    mocks.listStepsForQuest.mockResolvedValue([
      mcStep({
        pizza: {
          mode: "scored",
          maxSlices: 5,
          minRatioToComplete: 0.99,
          rounding: "floor",
          mapping: { kind: "linear" },
        },
      }),
    ]);

    const result = await completeQuestStepTask(accountId, runId, stepId, {
      attempt: { taskType: "MultipleChoice", multipleChoice: { selections: [[]] } },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected fail");
    expect(result.code).toBe("ratio_below_minimum");
    expect(mocks.rpcCompleteQuestStepTask).not.toHaveBeenCalled();
  });

  it("stub-only special screen calls RPC with 0 pizza slices under scored rules", async () => {
    mocks.listStepsForQuest.mockResolvedValue([
      {
        id: stepId,
        quest_id: questId,
        order_index: 0,
        step_kind: "task" as const,
        task_type: "SpecialScreen",
        template_key: "ss",
        logical_task_key: "logical-ss",
        content_payload: {
          blocks: [{ blockType: "stub" }],
        },
        reward_rules: {
          pizza: {
            mode: "scored",
            maxSlices: 5,
            minRatioToComplete: 1,
            rounding: "floor",
            mapping: { kind: "linear" },
          },
        },
        is_active: true,
      },
    ]);

    const result = await completeQuestStepTask(accountId, runId, stepId, {
      attempt: {
        taskType: "SpecialScreen",
        specialScreen: { blocks: [{ taskType: "Stub" as const }] },
      },
    });
    expect(result.ok).toBe(true);
    expect(mocks.rpcCompleteQuestStepTask).toHaveBeenCalledWith(accountId, runId, stepId, 0);
  });
});
