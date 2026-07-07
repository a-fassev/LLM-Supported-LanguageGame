import { beforeEach, describe, expect, it, vi } from "vitest";
import { PILOT_LEADERBOARD_USERNAMES } from "@/lib/game/leaderboard-pilot-whitelist";

const mocks = vi.hoisted(() => {
  const usernameIn = vi.fn();
  const teamIn = vi.fn(() => ({ in: usernameIn }));
  const select = vi.fn(() => ({ in: teamIn }));
  const from = vi.fn(() => ({ select }));

  return {
    usernameIn,
    teamIn,
    select,
    from,
    getSupabaseAdmin: vi.fn(() => ({ from })),
  };
});

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import { listLeaderboardPlayerRows } from "./game-progress-repository";

describe("listLeaderboardPlayerRows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usernameIn.mockResolvedValue({ data: [], error: null });
  });

  it("filters student_accounts to the pilot leaderboard whitelist", async () => {
    await listLeaderboardPlayerRows();

    expect(mocks.from).toHaveBeenCalledWith("student_accounts");
    expect(mocks.teamIn).toHaveBeenCalledWith("team", ["blue", "red"]);
    expect(mocks.usernameIn).toHaveBeenCalledWith("username", [...PILOT_LEADERBOARD_USERNAMES]);
  });

  it("maps lifetime pizza earned for whitelisted rows", async () => {
    mocks.usernameIn.mockResolvedValue({
      data: [
        {
          id: "account-1",
          username: "lively-fox-2088",
          team: "red",
          player_wallets: { lifetime_slices_earned: 120, total_backpack_pieces: 7 },
        },
      ],
      error: null,
    });

    const rows = await listLeaderboardPlayerRows();
    expect(rows).toEqual([
      {
        accountId: "account-1",
        username: "lively-fox-2088",
        team: "red",
        totalSlices: 120,
        totalBackpackPieces: 7,
      },
    ]);
  });
});
