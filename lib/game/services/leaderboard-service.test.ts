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

import { getLeaderboardState } from "./leaderboard-service";

const accountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadContentCatalog.mockResolvedValue(mockBackpackCatalog);
});

describe("getLeaderboardState", () => {
  it("maps overall ranks and self flag by account id with parallel fetches", async () => {
    mocks.getStudentAccountLeaderboardSelfContext.mockResolvedValue({
      username: "me",
      team: "blue",
      totalSlices: 5,
      totalBackpackPieces: 1,
    });
    mocks.listLeaderboardPlayerRows.mockResolvedValue([
      { accountId: otherId, username: "top", team: "red", totalSlices: 10, totalBackpackPieces: 3 },
      { accountId, username: "me", team: "blue", totalSlices: 5, totalBackpackPieces: 1 },
    ]);

    const result = await getLeaderboardState(accountId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

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
      username: "me",
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
      members: [{ username: "me", isSelf: true }],
    });
    expect(result.self).toMatchObject({
      overallRank: 2,
      totalSlices: 5,
      totalBackpackPieces: 1,
      backpackProgressPercent: 10,
    });
  });

  it("ranks self below the list when account is not in the capped player rows", async () => {
    mocks.getStudentAccountLeaderboardSelfContext.mockResolvedValue({
      username: "late",
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

    expect(result.self.overallRank).toBe(2);
    expect(result.self.totalSlices).toBe(0);
    expect(result.overall.every((row) => !row.isSelf)).toBe(true);
  });
});
