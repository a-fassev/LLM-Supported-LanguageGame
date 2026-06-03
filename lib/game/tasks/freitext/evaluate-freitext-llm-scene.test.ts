import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => vi.fn());
const judgeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/llm/freitextLlmEnv", () => ({
  resolveFreitextLlmEvaluatorEnv: envMock,
}));

vi.mock("@/lib/llm/freitextLlmEvaluationService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/llm/freitextLlmEvaluationService")>();
  return {
    ...actual,
    invokeFreitextLlmJudge: judgeMock,
  };
});

import { evaluateFreitextLlmScene } from "@/lib/game/tasks/freitext/evaluate-freitext-llm-scene";

const baseTask = {
  prompt: "Presentati",
  evaluation: {
    grammarWeight: 1,
    vocabularyWeight: 1,
    registerWeight: 1,
    passThreshold: 0.6,
  },
};

describe("evaluateFreitextLlmScene", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.mockReturnValue({
      nvidiaApiKey: "key",
      nvidiaBaseUrl: "https://example.test",
      nvidiaEvalModel: "test-model",
      llmTimeoutMs: 5000,
      llmMaxRetries: 0,
      gateTtlMinutes: 25,
    });
  });

  it("returns 503 when evaluator env is missing", async () => {
    envMock.mockReturnValue(null);
    const result = await evaluateFreitextLlmScene(
      { task: baseTask },
      { taskType: "FreitextLlm", freitextLlm: { answerText: "Ciao mondo." } },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(503);
      expect(result.code).toBe("evaluator_unavailable");
    }
    expect(judgeMock).not.toHaveBeenCalled();
  });

  it("rejects empty trimmed answers", async () => {
    const result = await evaluateFreitextLlmScene(
      { task: baseTask },
      { taskType: "FreitextLlm", freitextLlm: { answerText: "   " } },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.code).toBe("answer_empty");
    }
  });

  it("rejects answers below minWords", async () => {
    const result = await evaluateFreitextLlmScene(
      { task: { ...baseTask, minWords: 3 } },
      { taskType: "FreitextLlm", freitextLlm: { answerText: "Ciao mondo." } },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.code).toBe("answer_too_short");
    }
    expect(judgeMock).not.toHaveBeenCalled();
  });

  it("returns ratio and normalized feedback from the judge", async () => {
    judgeMock.mockResolvedValue({
      grammarScore: 0.8,
      vocabularyScore: 0.7,
      registerScore: 0.9,
      taskFulfillmentScore: 0.85,
      summaryFeedback: "Buon inizio!",
      grammarFeedback: "Ok",
      vocabularyFeedback: "Ok",
      registerFeedback: "Ok",
      taskFulfillmentFeedback: "Ok",
      nextStepAdvice: "Aggiungi un saluto.",
    });

    const result = await evaluateFreitextLlmScene(
      { task: baseTask, instruction: "Scrivi due frasi." },
      { taskType: "FreitextLlm", freitextLlm: { answerText: "Ciao, mi chiamo Luca. Piacere." } },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ratio).toBeGreaterThan(0);
      expect(result.ratio).toBeLessThanOrEqual(1);
      expect(result.feedback.summaryFeedback).toContain("Buon inizio");
      expect(result.feedback.nextStepAdvice).toContain("saluto");
    }
    expect(judgeMock).toHaveBeenCalledOnce();
  });

  it("returns 504 when the judge aborts (timeout)", async () => {
    const abortError = new Error("Request aborted");
    abortError.name = "AbortError";
    judgeMock.mockRejectedValue(abortError);

    const result = await evaluateFreitextLlmScene(
      { task: baseTask },
      { taskType: "FreitextLlm", freitextLlm: { answerText: "Ciao, mi chiamo Luca." } },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(504);
      expect(result.code).toBe("MODEL_TIMEOUT");
    }
  });
});
