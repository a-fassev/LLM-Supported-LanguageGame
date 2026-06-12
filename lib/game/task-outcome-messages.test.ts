import { describe, expect, it } from "vitest";
import { buildTaskOutcome, sceneOffersTaskRewards } from "@/lib/game/task-outcome-messages";

describe("buildTaskOutcome", () => {
  it("uses tutorial retry copy without pizza when the scene awards no rewards", () => {
    const outcome = buildTaskOutcome({
      passed: false,
      ratio: 0.5,
      awardedSlices: 0,
      awardedBackpackPieces: 0,
      sceneMaxRewardSlices: 0,
      sceneMaxRewardBackpack: 0,
    });
    expect(outcome.kind).toBe("retry");
    expect(outcome.body).not.toContain("pizza");
    expect(outcome.body).toContain("completare l'attivita");
  });

  it("mentions pizza on retry when the scene can award slices", () => {
    const outcome = buildTaskOutcome({
      passed: false,
      ratio: 0.5,
      awardedSlices: 0,
      awardedBackpackPieces: 0,
      sceneMaxRewardSlices: 10,
      sceneMaxRewardBackpack: 0,
    });
    expect(outcome.body).toContain("fette di pizza");
  });

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

describe("sceneOffersTaskRewards", () => {
  it("is false for tutorial scenes with zero max rewards", () => {
    expect(sceneOffersTaskRewards(0, 0)).toBe(false);
  });

  it("is true when either reward type can be granted", () => {
    expect(sceneOffersTaskRewards(1, 0)).toBe(true);
    expect(sceneOffersTaskRewards(0, 1)).toBe(true);
  });
});
