import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureWalletRow: vi.fn(),
  getWalletTotals: vi.fn(),
}));

vi.mock("@/lib/game/repositories/game-progress-repository", () => ({
  ensureWalletRow: mocks.ensureWalletRow,
  getWalletTotals: mocks.getWalletTotals,
}));

import { bootstrapGameState } from "@/lib/game/services/game-progress-service";

describe("bootstrapGameState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureWalletRow.mockResolvedValue(true);
    mocks.getWalletTotals.mockResolvedValue({ totalSlices: 3, totalBackpackPieces: 1 });
  });

  it("returns wallet totals and an empty chapter catalog", async () => {
    const result = await bootstrapGameState("account-1");

    expect(result).toEqual({
      ok: true,
      totalSlices: 3,
      totalBackpackPieces: 1,
      chapters: [],
    });
    expect(mocks.ensureWalletRow).toHaveBeenCalledWith("account-1");
    expect(mocks.getWalletTotals).toHaveBeenCalledWith("account-1");
  });

  it("fails when the wallet cannot be ensured", async () => {
    mocks.ensureWalletRow.mockResolvedValue(false);

    const result = await bootstrapGameState("account-1");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(500);
  });
});
