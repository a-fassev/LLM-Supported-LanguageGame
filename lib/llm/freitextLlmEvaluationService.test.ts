import { describe, expect, it } from "vitest";
import {
  mapFreitextLlmProviderError,
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

describe("mapFreitextLlmProviderError", () => {
  it("maps HTTP 429 to RATE_LIMITED with Italian copy", () => {
    const mapped = mapFreitextLlmProviderError({ status: 429, message: "rate limit" });
    expect(mapped).toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      retryable: true,
    });
    expect(mapped?.message).toContain("Controlla");
  });

  it("maps HTTP 401 and invalid API key errors to evaluator_unavailable", () => {
    expect(mapFreitextLlmProviderError({ status: 401, message: "Unauthorized" })).toMatchObject({
      status: 503,
      code: "evaluator_unavailable",
      retryable: false,
    });
    expect(
      mapFreitextLlmProviderError(new Error("Incorrect API key provided")),
    ).toMatchObject({
      status: 503,
      code: "evaluator_unavailable",
    });
  });

  it("maps provider 5xx errors to PROVIDER_UNAVAILABLE", () => {
    const mapped = mapFreitextLlmProviderError({ status: 502, message: "bad gateway" });
    expect(mapped).toMatchObject({
      status: 503,
      code: "PROVIDER_UNAVAILABLE",
      retryable: true,
    });
  });

  it("returns null for unrecognized errors", () => {
    expect(mapFreitextLlmProviderError(new Error("something else"))).toBeNull();
  });
});
