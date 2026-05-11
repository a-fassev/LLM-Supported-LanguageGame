import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateScore,
  mapProviderError,
  normalizeFeedback,
} from "../lib/llm/taskEvaluationService";

test("calculateScore respects strict_binary policy", () => {
  assert.equal(calculateScore("strict_binary", 1, 4, 1), 4);
  assert.equal(calculateScore("strict_binary", 0.99, 4, 1), 0);
});

test("calculateScore returns rounded points for partial_points policy", () => {
  assert.equal(calculateScore("partial_points", 0.5, 5, 0.6), 3);
});

test("calculateScore threshold_pass awards max points at or above threshold quality", () => {
  assert.equal(calculateScore("threshold_pass", 0.7, 5, 0.6), 5);
  assert.equal(calculateScore("threshold_pass", 0.59, 5, 0.6), 0);
});

test("normalizeFeedback trims and truncates long content", () => {
  const normalized = normalizeFeedback("  Sehr gut gemacht!  ", 20);
  assert.equal(normalized, "Sehr gut gemacht!");

  const longText =
    "Das ist ein wirklich sehr langer Text der kuerzer gemacht werden muss.";
  assert.ok(normalizeFeedback(longText, 25).endsWith("…"));
});

test("mapProviderError maps rate limits as retryable 429", () => {
  const error = mapProviderError({ status: 429, message: "rate limit exceeded" });
  assert.ok(error);
  assert.equal(error?.code, "RATE_LIMITED");
  assert.equal(error?.status, 429);
  assert.equal(error?.retryable, true);
});

test("mapProviderError maps 5xx provider errors as unavailable", () => {
  const error = mapProviderError({ statusCode: 503, message: "upstream failed" });
  assert.ok(error);
  assert.equal(error?.code, "PROVIDER_UNAVAILABLE");
  assert.equal(error?.status, 503);
});
