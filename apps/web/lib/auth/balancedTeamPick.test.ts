import { describe, expect, it } from "vitest";
import { pickBalancedTeam } from "./balancedTeamPick";

describe("pickBalancedTeam", () => {
  it("assigns to blue when blue is smaller", () => {
    expect(pickBalancedTeam(1, 3, () => 0)).toBe("blue");
  });

  it("assigns to red when red is smaller", () => {
    expect(pickBalancedTeam(4, 2, () => 0)).toBe("red");
  });

  it("uses random on tie", () => {
    expect(pickBalancedTeam(2, 2, () => 0.1)).toBe("blue");
    expect(pickBalancedTeam(2, 2, () => 0.9)).toBe("red");
  });
});
