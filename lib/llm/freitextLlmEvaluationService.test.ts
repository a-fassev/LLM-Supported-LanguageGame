import { describe, expect, it } from "vitest";
import {
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

describe("normalizeFeedbackForLearner", () => {
  it("uses Italian fallback when feedback is empty", () => {
    expect(normalizeFeedbackForLearner("   ")).toContain("Controlla");
    expect(normalizeFeedbackForLearner("   ")).not.toMatch(/Nice effort/i);
  });
});
