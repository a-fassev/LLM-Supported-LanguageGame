import { describe, expect, it } from "vitest";
import { buildTaskOutcome } from "@/lib/game/task-outcome-messages";

describe("buildTaskOutcome", () => {
  it("uses already-claimed copy when rewards were not granted again", () => {
    const outcome = buildTaskOutcome({
      passed: true,
      ratio: 1,
      awardedSlices: 0,
      awardedBackpackPieces: 0,
      rewardsAlreadyClaimed: true,
    });
    expect(outcome.awardedSlices).toBe(0);
    expect(outcome.body).toContain("gia guadagnato");
  });
});
