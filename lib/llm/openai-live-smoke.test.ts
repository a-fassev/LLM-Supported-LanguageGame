import { describe, expect, it } from "vitest";

import { parseFreitextLlmStepContent } from "@/lib/llm/freitextLlmContentSchema";
import {
  invokeFreitextLlmJudge,
  weightedSkillRatio,
} from "@/lib/llm/freitextLlmEvaluationService";
import { resolveFreitextLlmEvaluatorEnv } from "@/lib/llm/freitextLlmEnv";

const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY?.trim());

describe.skipIf(!hasOpenAiKey)("openai live smoke", () => {
  it(
    "invokes gpt-5.4-nano judge for a short Italian answer",
    async () => {
      const env = resolveFreitextLlmEvaluatorEnv();
      expect(env).not.toBeNull();

      const parsed = parseFreitextLlmStepContent({
        prompt: "Come ti presenteresti a un nuovo compagno di classe?",
        targetLanguage: "it",
        minWords: 2,
        maxWords: 40,
        evaluation: {
          grammarWeight: 1,
          vocabularyWeight: 1,
          registerWeight: 1,
          taskFulfillmentWeight: 1,
          passThreshold: 0.6,
          registerTarget: "informal",
          scoringPolicy: "threshold_pass",
          maxPoints: 5,
          evaluationCriteria: [
            "Use a simple Italian greeting and self-introduction",
            "Write at least two complete sentences",
          ],
        },
      });
      expect(parsed.ok).toBe(true);
      if (!parsed.ok || !env) return;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.llmTimeoutMs);
      const started = Date.now();

      try {
        const out = await invokeFreitextLlmJudge(
          parsed.value,
          "Ciao! Mi chiamo Luca e ho dieci anni. Piacere di conoscerti.",
          env,
          controller.signal,
        );

        const ratio = weightedSkillRatio(parsed.value.evaluation, out);
        const elapsedMs = Date.now() - started;

        expect(out.summaryFeedback.length).toBeGreaterThan(0);
        expect(out.grammarScore).toBeGreaterThanOrEqual(0);
        expect(out.grammarScore).toBeLessThanOrEqual(1);
        expect(ratio).toBeGreaterThan(0);

        console.log(`[openai-live-smoke] ok in ${elapsedMs}ms, ratio=${ratio.toFixed(3)}`);
        console.log(`[openai-live-smoke] summary=${out.summaryFeedback.slice(0, 100)}`);
      } finally {
        clearTimeout(timer);
      }
    },
    120_000,
  );
});
