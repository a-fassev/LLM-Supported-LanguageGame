import { afterEach, describe, expect, it } from "vitest";
import { resolveFreitextLlmEvaluatorEnv } from "@/lib/llm/freitextLlmEnv";

describe("resolveFreitextLlmEvaluatorEnv", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when OPENAI_API_KEY is missing", () => {
    delete process.env.OPENAI_API_KEY;
    expect(resolveFreitextLlmEvaluatorEnv()).toBeNull();
  });

  it("returns env with default model when OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.OPENAI_EVAL_MODEL;
    delete process.env.LLM_TASK_MAX_RETRIES;
    const env = resolveFreitextLlmEvaluatorEnv();
    expect(env).toMatchObject({
      openaiModel: "gpt-5.4-nano-2026-03-17",
      openaiApiKey: "test-key",
      llmMaxRetries: 2,
    });
  });
});
