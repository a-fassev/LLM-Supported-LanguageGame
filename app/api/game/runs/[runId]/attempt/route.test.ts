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
});
