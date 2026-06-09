import { describe, expect, it } from "vitest";
import {
  isGeminiRateLimitError,
  normalizeFeedbackForLearner,
  weightedSkillRatio,
} from "@/lib/llm/freitextLlmEvaluationService";

const baseWeights = {
  grammarWeight: 1,
  vocabularyWeight: 1,
  registerWeight: 1,
  taskFulfillmentWeight: 1,
};

describe("weightedSkillRatio", () => {
  it("includes taskFulfillmentScore in the weighted mean", () => {
    const highTask = weightedSkillRatio(baseWeights, {
      grammarScore: 1,
      vocabularyScore: 1,
      registerScore: 1,
      taskFulfillmentScore: 0,
    });
    expect(highTask).toBeCloseTo(0.75, 2);

    const lowGrammar = weightedSkillRatio(baseWeights, {
      grammarScore: 0,
      vocabularyScore: 1,
      registerScore: 1,
      taskFulfillmentScore: 1,
    });
    expect(lowGrammar).toBeCloseTo(0.75, 2);
  });

  it("respects taskFulfillmentWeight", () => {
    const ratio = weightedSkillRatio(
      { ...baseWeights, taskFulfillmentWeight: 3 },
      {
        grammarScore: 1,
        vocabularyScore: 1,
        registerScore: 1,
        taskFulfillmentScore: 0,
      },
    );
    expect(ratio).toBeCloseTo(0.5, 2);
  });
});

describe("isGeminiRateLimitError", () => {
  it("detects HTTP 429 and RESOURCE_EXHAUSTED style errors", () => {
    expect(isGeminiRateLimitError({ status: 429, message: "busy" })).toBe(true);
    expect(
      isGeminiRateLimitError({ code: "RESOURCE_EXHAUSTED", message: "quota exceeded" }),
    ).toBe(true);
    expect(isGeminiRateLimitError(new Error("rate limit exceeded"))).toBe(true);
    expect(isGeminiRateLimitError(new Error("invalid api key"))).toBe(false);
  });
});

describe("normalizeFeedbackForLearner", () => {
  it("uses Italian fallback when feedback is empty", () => {
    expect(normalizeFeedbackForLearner("   ")).toContain("Controlla");
    expect(normalizeFeedbackForLearner("   ")).not.toMatch(/Nice effort/i);
  });
});
