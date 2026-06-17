import { describe, expect, it } from "vitest";
import { buildTaskOutcome } from "@/lib/game/task-outcome-messages";

describe("buildTaskOutcome", () => {
  it("awards partial pizza on low ratio success", () => {
    const outcome = buildTaskOutcome({
      ratio: 0.5,
      awardedSlices: 1,
      awardedBackpackPieces: 1,
    });
    expect(outcome.body).toMatch(/fett[ae] di pizza/);
    expect(outcome.awardedSlices).toBe(1);
    expect(outcome.awardedBackpackPieces).toBe(1);
  });

  it("uses neutral copy for very low ratio", () => {
    const outcome = buildTaskOutcome({
      ratio: 0.25,
      awardedSlices: 0,
      awardedBackpackPieces: 1,
    });
    expect(outcome.body).toContain("completato l'attivita");
  });

  it("appends freetext summary and advice to overlay body", () => {
    const summary = "Buon inizio";
    const advice = "Aggiungi un saluto.";
    const outcome = buildTaskOutcome({
      ratio: 0.7,
      awardedSlices: 2,
      awardedBackpackPieces: 1,
      summaryFeedback: summary,
      nextStepAdvice: advice,
    });
    expect(outcome.body).toContain(summary);
    expect(outcome.body).toContain(advice);
  });

  it("uses already-claimed copy when rewards were not granted again", () => {
    const outcome = buildTaskOutcome({
      ratio: 1,
      awardedSlices: 0,
      awardedBackpackPieces: 0,
      rewardsAlreadyClaimed: true,
    });
    expect(outcome.awardedSlices).toBe(0);
    expect(outcome.body).toContain("gia guadagnato");
  });
});
