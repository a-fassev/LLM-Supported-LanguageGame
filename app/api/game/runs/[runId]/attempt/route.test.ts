import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  completeTaskScene: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@/lib/require-session", () => ({
  requireSessionAccount: vi.fn(async () => ({ ok: true as const, accountId: "acc-1" })),
}));

vi.mock("@/lib/game/services/game-progress-service", () => ({
  completeTaskScene: mocks.completeTaskScene,
}));

import { POST } from "@/app/api/game/runs/[runId]/attempt/route";

describe("POST /api/game/runs/[runId]/attempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockReturnValue(true);
    mocks.completeTaskScene.mockResolvedValue({
      ok: true,
      totalSlices: 1,
      totalBackpackPieces: 0,
      run: { runId: "run-1" },
    });
  });

  it("returns 429 when account attempt rate limit is exceeded", async () => {
    mocks.checkRateLimit.mockImplementation((key: string) => {
      if (key.startsWith("game_runs_attempt_account:")) return false;
      return true;
    });

    const response = await POST(
      new Request("http://localhost/api/game/runs/run-1/attempt", {
        method: "POST",
        body: JSON.stringify({ sceneId: "scene-1", attempt: {} }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ runId: "run-1" }) },
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
    expect(mocks.completeTaskScene).not.toHaveBeenCalled();
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("game_runs_attempt_account:acc-1", 60, 60_000);
  });

  it("passes taskReview on success and retry responses", async () => {
    mocks.completeTaskScene.mockResolvedValueOnce({
      ok: true,
      totalSlices: 2,
      totalBackpackPieces: 1,
      run: { runId: "run-1" },
      taskOutcome: { kind: "success", ratio: 1, awardedSlices: 2, awardedBackpackPieces: 1, headline: "x", body: "y" },
      taskReview: {
        screenType: "cloze",
        gaps: [{ gapIndex: 0, typedAnswer: "a", acceptedAnswers: ["a"], isCorrect: true }],
      },
    });

    const success = await POST(
      new Request("http://localhost/api/game/runs/run-1/attempt", {
        method: "POST",
        body: JSON.stringify({ sceneId: "scene-1", attempt: {} }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ runId: "run-1" }) },
    );
    const successBody = await success.json();
    expect(successBody.ok).toBe(true);
    expect(successBody.taskReview?.screenType).toBe("cloze");

    mocks.completeTaskScene.mockResolvedValueOnce({
      ok: false,
      status: 409,
      error: "retry",
      code: "task_min_ratio_not_met",
      taskOutcome: { kind: "retry", ratio: 0.5, awardedSlices: 0, awardedBackpackPieces: 0, headline: "x", body: "y" },
      taskReview: {
        screenType: "multiple_choice",
        questions: [
          {
            questionIndex: 0,
            selectedIds: ["b"],
            correctOptionIds: ["a"],
            isCorrect: false,
          },
        ],
      },
      details: {},
    });

    const retry = await POST(
      new Request("http://localhost/api/game/runs/run-1/attempt", {
        method: "POST",
        body: JSON.stringify({ sceneId: "scene-1", attempt: {} }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ runId: "run-1" }) },
    );
    const retryBody = await retry.json();
    expect(retryBody.ok).toBe(false);
    expect(retryBody.details?.taskReview?.screenType).toBe("multiple_choice");
  });
});
