import { describe, expect, it } from "vitest";
import { compareLeaderboardPlayers } from "./leaderboard-player-sort";

describe("compareLeaderboardPlayers", () => {
  it("orders by slices descending then username with Italian locale", () => {
    const players = [
      { username: "zara", totalSlices: 5 },
      { username: "alba", totalSlices: 10 },
      { username: "bruno", totalSlices: 5 },
    ];
    players.sort(compareLeaderboardPlayers);
    expect(players.map((p) => p.username)).toEqual(["alba", "bruno", "zara"]);
  });
});
