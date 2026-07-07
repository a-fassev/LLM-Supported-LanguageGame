import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStudentAccountLeaderboardSelfContext: vi.fn(),
  listLeaderboardPlayerRows: vi.fn(),
  loadContentCatalog: vi.fn(),
}));

const mockBackpackCatalog = {
  chapters: [
    {
      id: "chapter-01",
      questsExpanded: [{ scenes: Array.from({ length: 10 }, () => ({ scene_type: "task" })) }],
    },
  ],
};

vi.mock("@/lib/game/content/catalog-loader", () => ({
  loadContentCatalog: mocks.loadContentCatalog,
}));

vi.mock("@/lib/game/repositories/game-progress-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/game/repositories/game-progress-repository")>();
  return {
    ...actual,
    getStudentAccountLeaderboardSelfContext: mocks.getStudentAccountLeaderboardSelfContext,
    listLeaderboardPlayerRows: mocks.listLeaderboardPlayerRows,
  };
});

import { gameClientMessages as msg } from "@/lib/game/clientMessages";
import { getLeaderboardState } from "./leaderboard-service";

const accountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const eligibleUsername = "lively-fox-2088";
const ineligibleUsername = "quick-eagle-1813";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadContentCatalog.mockResolvedValue(mockBackpackCatalog);
});

describe("getLeaderboardState", () => {
  it("returns unavailable for non-whitelisted viewers without loading player rows", async () => {
    mocks.getStudentAccountLeaderboardSelfContext.mockResolvedValue({
      username: ineligibleUsername,
      team: "red",
      totalSlices: 35,
      totalBackpackPieces: 6,
    });

    const result = await getLeaderboardState(accountId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.eligible).toBe(false);
    if (result.eligible) return;

    expect(result.message).toBe(msg.leaderboardNotAvailable);
    expect(mocks.listLeaderboardPlayerRows).not.toHaveBeenCalled();
    expect(mocks.loadContentCatalog).not.toHaveBeenCalled();
  });

  it("maps overall ranks and self flag by account id for whitelisted viewers", async () => {
    mocks.getStudentAccountLeaderboardSelfContext.mockResolvedValue({
      username: eligibleUsername,
      team: "blue",
      totalSlices: 5,
      totalBackpackPieces: 1,
    });
    mocks.listLeaderboardPlayerRows.mockResolvedValue([
      { accountId: otherId, username: "top", team: "red", totalSlices: 10, totalBackpackPieces: 3 },
      { accountId, username: eligibleUsername, team: "blue", totalSlices: 5, totalBackpackPieces: 1 },
    ]);

    const result = await getLeaderboardState(accountId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.eligible).toBe(true);
    if (!result.eligible) return;

    expect(mocks.listLeaderboardPlayerRows).toHaveBeenCalledTimes(1);
    expect(mocks.getStudentAccountLeaderboardSelfContext).toHaveBeenCalledTimes(1);
    expect(result.overall[0]).toMatchObject({
      rank: 1,
      username: "top",
      isSelf: false,
      totalBackpackPieces: 3,
      backpackProgressPercent: 30,
    });
    expect(result.overall[1]).toMatchObject({
      rank: 2,
      username: eligibleUsername,
      isSelf: true,
      totalBackpackPieces: 1,
      backpackProgressPercent: 10,
    });
    expect(result.teams[0]).toMatchObject({
      rank: 1,
      team: "red",
      totalSlices: 10,
      memberCount: 1,
      members: [{ username: "top", isSelf: false }],
    });
    expect(result.teams[1]).toMatchObject({
      rank: 2,
      team: "blue",
      memberCount: 1,
      members: [{ username: eligibleUsername, isSelf: true }],
    });
    expect(result.self).toMatchObject({
      overallRank: 2,
      totalSlices: 5,
      totalBackpackPieces: 1,
      backpackProgressPercent: 10,
    });
  });

  it("ranks by lifetime earned pizza even when spendable balance is lower after shop purchases", async () => {
    mocks.getStudentAccountLeaderboardSelfContext.mockResolvedValue({
      username: eligibleUsername,
      team: "blue",
      totalSlices: 120,
      totalBackpackPieces: 1,
    });
    mocks.listLeaderboardPlayerRows.mockResolvedValue([
      { accountId, username: eligibleUsername, team: "blue", totalSlices: 120, totalBackpackPieces: 1 },
      { accountId: otherId, username: "shopper", team: "red", totalSlices: 80, totalBackpackPieces: 0 },
    ]);

    const result = await getLeaderboardState(accountId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.eligible).toBe(true);
    if (!result.eligible) return;

    expect(result.overall[0]).toMatchObject({
      rank: 1,
      username: eligibleUsername,
      totalSlices: 120,
      isSelf: true,
    });
    expect(result.overall[1]).toMatchObject({
      rank: 2,
      username: "shopper",
      totalSlices: 80,
    });
    expect(result.self.totalSlices).toBe(120);
  });

  it("ranks self below the list when account is not in the capped player rows", async () => {
    mocks.getStudentAccountLeaderboardSelfContext.mockResolvedValue({
      username: eligibleUsername,
      team: "red",
      totalSlices: 0,
      totalBackpackPieces: 0,
    });
    mocks.listLeaderboardPlayerRows.mockResolvedValue([
      { accountId: otherId, username: "top", team: "blue", totalSlices: 1, totalBackpackPieces: 0 },
    ]);

    const result = await getLeaderboardState(accountId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.eligible).toBe(true);
    if (!result.eligible) return;

    expect(result.self.overallRank).toBe(2);
    expect(result.self.totalSlices).toBe(0);
    expect(result.overall.every((row) => !row.isSelf)).toBe(true);
  });
});
