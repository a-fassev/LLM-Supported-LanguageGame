import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AllGeminiApiKeysRateLimitedError,
  createGeminiApiKeyPool,
} from "@/lib/llm/gemini-api-key-pool";

describe("createGeminiApiKeyPool", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when no keys are provided", () => {
    expect(() => createGeminiApiKeyPool([])).toThrow(/at least one key/i);
  });

  it("round-robins across available keys", () => {
    const pool = createGeminiApiKeyPool(["k1", "k2", "k3"]);
    expect(pool.acquireKey()).toEqual({ index: 0, apiKey: "k1" });
    expect(pool.acquireKey()).toEqual({ index: 1, apiKey: "k2" });
    expect(pool.acquireKey()).toEqual({ index: 2, apiKey: "k3" });
    expect(pool.acquireKey()).toEqual({ index: 0, apiKey: "k1" });
  });

  it("skips keys in cooldown and throws when all are rate limited", () => {
    const pool = createGeminiApiKeyPool(["k1", "k2"], 60_000);
    const first = pool.acquireKey();
    pool.markRateLimited(first.index);
    expect(pool.acquireKey()).toEqual({ index: 1, apiKey: "k2" });
    pool.markRateLimited(1);
    expect(() => pool.acquireKey()).toThrow(AllGeminiApiKeysRateLimitedError);
  });

  it("reuses a key after cooldown expires", () => {
    const pool = createGeminiApiKeyPool(["k1"], 1_000);
    pool.markRateLimited(0);
    expect(() => pool.acquireKey()).toThrow(AllGeminiApiKeysRateLimitedError);
    vi.advanceTimersByTime(1_001);
    expect(pool.acquireKey()).toEqual({ index: 0, apiKey: "k1" });
  });
});
