import { describe, expect, it } from "vitest";
import {
  isLeaderboardEligibleUsername,
  PILOT_LEADERBOARD_USERNAMES,
} from "./leaderboard-pilot-whitelist";

describe("leaderboard-pilot-whitelist", () => {
  it("lists 17 unique pilot usernames", () => {
    expect(PILOT_LEADERBOARD_USERNAMES).toHaveLength(17);
    expect(new Set(PILOT_LEADERBOARD_USERNAMES).size).toBe(17);
  });

  it("accepts every whitelisted username", () => {
    for (const username of PILOT_LEADERBOARD_USERNAMES) {
      expect(isLeaderboardEligibleUsername(username)).toBe(true);
    }
  });

  it("rejects all documented leaderboard-excluded pilot usernames", () => {
    const excluded = [
      "curious-panda-5792",
      "calm-raven-7566",
      "gentle-eagle-7159",
      "quick-eagle-1813",
      "swift-wolf-7096",
      "swift-lion-4381",
    ];
    for (const username of excluded) {
      expect(isLeaderboardEligibleUsername(username)).toBe(false);
    }
  });

  it("rejects unknown usernames", () => {
    expect(isLeaderboardEligibleUsername("merry-fox-1647")).toBe(false);
    expect(isLeaderboardEligibleUsername("")).toBe(false);
  });
});
