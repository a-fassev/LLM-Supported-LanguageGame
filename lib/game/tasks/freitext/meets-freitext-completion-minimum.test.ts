import { describe, expect, it } from "vitest";
import { meetsTaskSceneCompletionMinimum } from "@/lib/game/tasks/freitext/meets-freitext-completion-minimum";

const freitextTask = {
  prompt: "Presentati",
  evaluation: {
    grammarWeight: 1,
    vocabularyWeight: 1,
    registerWeight: 1,
    passThreshold: 0.6,
  },
};

describe("meetsTaskSceneCompletionMinimum", () => {
  it("uses minRatioToComplete for scored free_text", () => {
    const scored = {
      kind: "scored" as const,
      maxSlices: 2,
      minRatioToComplete: 0.7,
      rounding: "floor" as const,
      mapping: { kind: "linear" as const },
    };
    expect(
      meetsTaskSceneCompletionMinimum({
        ratio: 0.69,
        screenType: "free_text",
        pizzaRules: scored,
        taskPayload: freitextTask,
      }),
    ).toBe(false);
    expect(
      meetsTaskSceneCompletionMinimum({
        ratio: 0.7,
        screenType: "free_text",
        pizzaRules: scored,
        taskPayload: freitextTask,
      }),
    ).toBe(true);
  });

  it("uses evaluation.passThreshold for flat free_text", () => {
    const flat = { kind: "flat" as const, slices: 2 };
    expect(
      meetsTaskSceneCompletionMinimum({
        ratio: 0.5,
        screenType: "free_text",
        pizzaRules: flat,
        taskPayload: freitextTask,
      }),
    ).toBe(false);
    expect(
      meetsTaskSceneCompletionMinimum({
        ratio: 0.6,
        screenType: "free_text",
        pizzaRules: flat,
        taskPayload: freitextTask,
      }),
    ).toBe(true);
  });

  it("ignores ratio bar for flat non-freetext tasks", () => {
    const flat = { kind: "flat" as const, slices: 1 };
    expect(
      meetsTaskSceneCompletionMinimum({
        ratio: 0,
        screenType: "multiple_choice",
        pizzaRules: flat,
      }),
    ).toBe(true);
  });
});
