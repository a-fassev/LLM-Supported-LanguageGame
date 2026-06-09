import { afterEach, describe, expect, it } from "vitest";
import {
  parseGeminiApiKeysFromEnv,
  resolveFreitextLlmEvaluatorEnv,
} from "@/lib/llm/freitextLlmEnv";

describe("parseGeminiApiKeysFromEnv", () => {
  it("collects numbered keys in order and skips empty slots", () => {
    const keys = parseGeminiApiKeysFromEnv({
      GEMINI_API_KEY_1: " alpha ",
      GEMINI_API_KEY_2: "",
      GEMINI_API_KEY_3: "beta",
    });
    expect(keys).toEqual(["alpha", "beta"]);
  });
});

describe("resolveFreitextLlmEvaluatorEnv", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when no Gemini keys are configured", () => {
    delete process.env.GEMINI_API_KEY_1;
    delete process.env.GEMINI_API_KEY_2;
    delete process.env.GEMINI_API_KEY_3;
    delete process.env.GEMINI_API_KEY_4;
    expect(resolveFreitextLlmEvaluatorEnv()).toBeNull();
  });

  it("returns env with default model when at least one key exists", () => {
    process.env.GEMINI_API_KEY_1 = "test-key";
    delete process.env.GEMINI_EVAL_MODEL;
    const env = resolveFreitextLlmEvaluatorEnv();
    expect(env).toMatchObject({
      geminiModel: "gemini-3.5-flash",
      geminiApiKeys: ["test-key"],
    });
  });
});
