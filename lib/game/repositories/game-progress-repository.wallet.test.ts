import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const walletUpdateSelectMaybeSingle = vi.fn();
  const walletUpdateSelect = vi.fn(() => ({ maybeSingle: walletUpdateSelectMaybeSingle }));
  const walletUpdateEqSlices = vi.fn(() => ({ select: walletUpdateSelect }));
  const walletUpdateEqAccount = vi.fn(() => ({ eq: walletUpdateEqSlices }));
  const walletUpdate = vi.fn(() => ({ eq: walletUpdateEqAccount }));

  const walletReadMaybeSingle = vi.fn();
  const walletReadEq = vi.fn(() => ({ maybeSingle: walletReadMaybeSingle }));
  const walletReadSelect = vi.fn(() => ({ eq: walletReadEq }));

  const walletUpsert = vi.fn();

  const walletFrom = vi.fn(() => ({
    select: walletReadSelect,
    update: walletUpdate,
    upsert: walletUpsert,
  }));

  const roomDeleteEqItem = vi.fn().mockResolvedValue({ error: null });
  const roomDeleteEqAccount = vi.fn(() => ({ eq: roomDeleteEqItem }));
  const roomDelete = vi.fn(() => ({ eq: roomDeleteEqAccount }));
  const roomInsert = vi.fn();

  const roomFrom = vi.fn(() => ({ insert: roomInsert, delete: roomDelete }));

  const from = vi.fn((table: string) => {
    if (table === "player_wallets") return walletFrom();
    if (table === "player_room_items") return roomFrom();
    throw new Error(`unexpected table ${table}`);
  });

  return {
    from,
    walletReadMaybeSingle,
    walletUpdate,
    walletUpsert,
    roomInsert,
    getSupabaseAdmin: vi.fn(() => ({ from })),
  };
});

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { incrementWalletTotals, purchaseRoomItem } from "./game-progress-repository";

describe("incrementWalletTotals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.walletUpsert.mockResolvedValue({ error: null });
    mocks.walletReadMaybeSingle.mockResolvedValue({
      data: {
        total_slices: 45,
        total_backpack_pieces: 3,
        lifetime_slices_earned: 120,
      },
      error: null,
    });
    mocks.walletUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it("ensures wallet row exists before crediting rewards", async () => {
    const ok = await incrementWalletTotals("account-1", 5, 1);
    expect(ok).toBe(true);
    expect(mocks.walletUpsert).toHaveBeenCalled();
  });

  it("increments spendable balance and lifetime earned on rewards", async () => {
    const ok = await incrementWalletTotals("account-1", 5, 1);
    expect(ok).toBe(true);
    expect(mocks.walletUpdate).toHaveBeenCalledWith({
      total_slices: 50,
      total_backpack_pieces: 4,
      lifetime_slices_earned: 125,
      updated_at: expect.any(String),
    });
  });

  it("does not reduce lifetime earned when slice delta is zero", async () => {
    const ok = await incrementWalletTotals("account-1", 0, 2);
    expect(ok).toBe(true);
    expect(mocks.walletUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        total_slices: 45,
        lifetime_slices_earned: 120,
      }),
    );
  });
});

describe("purchaseRoomItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.walletUpsert.mockResolvedValue({ error: null });
    mocks.roomInsert.mockResolvedValue({ error: null });
    mocks.walletReadMaybeSingle.mockResolvedValue({
      data: { total_slices: 50, total_backpack_pieces: 0 },
      error: null,
    });
    mocks.walletUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { account_id: "account-1" }, error: null }),
          }),
        }),
      }),
    });
  });

  it("debits spendable balance only and leaves lifetime earned unchanged", async () => {
    const result = await purchaseRoomItem("account-1", "rug", 40);
    expect(result).toEqual({ ok: true });
    expect(mocks.walletUpdate).toHaveBeenCalledWith({
      total_slices: 10,
      updated_at: expect.any(String),
    });
  });
});
