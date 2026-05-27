import { describe, expect, it } from "vitest";
import { computeLeaderboardTeamAggregates } from "./game-progress-repository";

describe("computeLeaderboardTeamAggregates", () => {
  it("sums slices and members per team", () => {
    const aggregates = computeLeaderboardTeamAggregates([
      { accountId: "1", username: "a", team: "blue", totalSlices: 3 },
      { accountId: "2", username: "b", team: "red", totalSlices: 10 },
      { accountId: "3", username: "c", team: "blue", totalSlices: 2 },
    ]);

    expect(aggregates[0]).toMatchObject({ team: "red", totalSlices: 10, memberCount: 1 });
    expect(aggregates[1]).toMatchObject({ team: "blue", totalSlices: 5, memberCount: 2 });
  });
});
