import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogle } from "@langchain/google/node";

import type { FreitextLlmStepContentParsed } from "@/lib/llm/freitextLlmContentSchema";
import type { FreitextLlmEvaluatorEnv } from "@/lib/llm/freitextLlmEnv";
import {
  AllGeminiApiKeysRateLimitedError,
  createGeminiApiKeyPool,
  type GeminiApiKeyPool,
} from "@/lib/llm/gemini-api-key-pool";
import {
  freitextLlmStructuredOutputSchema,
} from "@/lib/llm/freitextLlmModelSchema";

const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 60_000;

let cachedPool: GeminiApiKeyPool | null = null;
let cachedPoolFingerprint = "";

function getGeminiApiKeyPool(env: FreitextLlmEvaluatorEnv): GeminiApiKeyPool {
  const fingerprint = env.geminiApiKeys.join("\0");
  if (!cachedPool || cachedPoolFingerprint !== fingerprint) {
    cachedPool = createGeminiApiKeyPool(env.geminiApiKeys);
    cachedPoolFingerprint = fingerprint;
  }
  return cachedPool;
}

function createFreitextModel(apiKey: string, env: FreitextLlmEvaluatorEnv) {
  return new ChatGoogle({
    model: env.geminiModel,
    apiKey,
    temperature: 0.2,
    maxRetries: 0,
    streamUsage: false,
    ...(env.llmTimeoutMs > 0 ? { timeout: env.llmTimeoutMs } : {}),
  });
}

const freitextJudgePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "You evaluate short written learner answers for classroom Italian practice.",
      "Learners attend a gifted-education school; answers must be written in Italian only.",
      "",
      "STEP 1 — Validity check (before scoring).",
      "If ANY condition holds, treat the answer as invalid: set ALL four scores to 0, state clearly in summaryFeedback why it is invalid, and keep other feedback fields brief and constructive.",
      "- The text is not entirely in Italian (any German, another language, mixed-language text, gibberish, or copied filler).",
      "- The text does not address the teacher prompt, instruction, or task.",
      "- The text is empty or only one or two words with no meaningful attempt.",
      "",
      "STEP 2 — If valid, score FOUR independent dimensions on a continuous 0..1 interval:",
      "- taskFulfillmentScore: required content covered, sufficient scope, and overall task fit (prompt, instruction, evaluation criteria).",
      "- vocabularyScore: correct use of target structures and target vocabulary from the task — apply the strictest standard here.",
      "- grammarScore: morphological correctness, spelling, and whether the Italian is understandable; understandability matters more than perfection.",
      "- registerScore: fit of tone (formality, politeness) vs the communicated register target.",
      "",
      "Scoring principles:",
      "- Understandability outweighs perfection; minor errors that do not block comprehension deserve only mild penalties.",
      "- Be lenient on grammar/vocabulary the task has not yet taught; be strict on the declared target structures and target vocabulary.",
      "- Be concise, factual, motivational, and child-safe.",
      "Return ONLY the structured output fields enforced by schema.",
      "Never shame the learner; avoid harsh wording.",
    ].join("\n"),
  ],
  [
    "human",
    [
      "Teacher prompt:",
      "{prompt}",
      "",
      "Optional instruction:",
      "{instruction}",
      "",
      "Declared targetLanguage tag:",
      "{targetLanguage}",
      "",
      "Register target guidance:",
      "{registerTarget}",
      "",
      "Important structures:",
      "{targetStructures}",
      "",
      "Teacher evaluation criteria:",
      "{criteria}",
      "",
      "Reference material for the learner (if any):",
      "{referenceDocument}",
      "",
      "Learner answer:",
      "{answer}",
    ].join("\n"),
  ],
]);

export function isGeminiRateLimitError(error: unknown): boolean {
  const status = readNumeric(error, "status") ?? readNumeric(error, "statusCode");
  if (status === 429) return true;

  const message = readString(error, "message") ?? stringFrom(error) ?? "";
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("resource_exhausted")) {
    return true;
  }

  if (error && typeof error === "object" && "code" in error) {
    const code = (error as Record<string, unknown>).code;
    if (code === "RESOURCE_EXHAUSTED" || code === 429) return true;
  }

  return false;
}

function readRetryAfterMs(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;

  const headers = (error as Record<string, unknown>).headers;
  if (!headers || typeof headers !== "object") return null;

  const retryAfter = (headers as Record<string, unknown>)["retry-after"];
  if (typeof retryAfter === "string") {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  }

  return null;
}

function toRateLimitError(cause?: unknown): Error & { status: number } {
  const error = new Error("Gemini API rate limit exceeded") as Error & { status: number };
  error.status = 429;
  if (cause !== undefined) {
    (error as Error & { cause?: unknown }).cause = cause;
  }
  return error;
}

export async function invokeFreitextLlmJudge(
  content: FreitextLlmStepContentParsed,
  learnerAnswer: string,
  env: FreitextLlmEvaluatorEnv,
  signal: AbortSignal,
) {
  const instruction = content.instruction?.trim() ?? "";
  const criteria = content.evaluation.evaluationCriteria.join("; ");
  const structures = content.evaluation.targetStructures.join("; ");

  const registerTarget =
    typeof content.evaluation.registerTarget === "string"
      ? content.evaluation.registerTarget
      : "neutral";

  const referenceDocument = content.referenceDocument
    ? `${content.referenceDocument.title}\n${content.referenceDocument.bodyText}`
    : "(none)";

  const invoked = await freitextJudgePrompt.invoke({
    prompt: content.prompt.trim(),
    instruction: instruction === "" ? "(none)" : instruction,
    targetLanguage: content.targetLanguage?.trim() || "unspecified",
    registerTarget,
    criteria,
    targetStructures: structures === "" ? "(none supplied)" : structures,
    referenceDocument,
    answer: learnerAnswer.trim(),
  });

  const pool = getGeminiApiKeyPool(env);
  const maxAttempts = Math.max(1, env.geminiApiKeys.length);
  let lastRateLimitError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let selection;
    try {
      selection = pool.acquireKey();
    } catch (error) {
      if (error instanceof AllGeminiApiKeysRateLimitedError) {
        throw toRateLimitError(lastRateLimitError);
      }
      throw error;
    }

    try {
      const model = createFreitextModel(selection.apiKey, env).withStructuredOutput(
        freitextLlmStructuredOutputSchema,
      );

      const chat = await model.invoke(invoked, {
        signal,
        tags: ["feature:freitext-llm", "surface:learning-game"],
        metadata: {
          targetLanguageTag: content.targetLanguage ?? "",
          geminiKeyIndex: selection.index,
        },
      });

      return freitextLlmStructuredOutputSchema.parse(chat);
    } catch (error) {
      if (isGeminiRateLimitError(error)) {
        pool.markRateLimited(
          selection.index,
          readRetryAfterMs(error) ?? DEFAULT_RATE_LIMIT_COOLDOWN_MS,
        );
        lastRateLimitError = error;
        continue;
      }
      throw error;
    }
  }

  throw toRateLimitError(lastRateLimitError);
}

export type WeightInput = Pick<
  FreitextLlmStepContentParsed["evaluation"],
  "grammarWeight" | "vocabularyWeight" | "registerWeight" | "taskFulfillmentWeight"
>;

export type FreitextSkillScores = {
  grammarScore: number;
  vocabularyScore: number;
  registerScore: number;
  taskFulfillmentScore: number;
};

export function weightedSkillRatio(weights: WeightInput, scores: FreitextSkillScores): number {
  const taskWeight = weights.taskFulfillmentWeight;
  const denom =
    weights.grammarWeight + weights.vocabularyWeight + weights.registerWeight + taskWeight;
  if (!(denom > 0)) return 0;
  const weighted =
    (taskWeight * scores.taskFulfillmentScore +
      weights.grammarWeight * scores.grammarScore +
      weights.vocabularyWeight * scores.vocabularyScore +
      weights.registerWeight * scores.registerScore) /
    denom;
  return Math.min(1, Math.max(0, weighted));
}

export function calculateScore(
  scoringPolicy: "strict_binary" | "partial_points" | "threshold_pass",
  normalizedQuality: number,
  maxPoints: number,
  passThreshold: number,
): number {
  const normalized = Math.min(1, Math.max(0, normalizedQuality));
  const threshold = Math.min(1, Math.max(0, passThreshold));

  if (scoringPolicy === "strict_binary") {
    return normalized >= 1 ? maxPoints : 0;
  }

  if (scoringPolicy === "partial_points") {
    return Math.round(normalized * maxPoints);
  }

  return normalized >= threshold ? maxPoints : 0;
}

export function normalizeFeedbackForLearner(text: string, maxLength = 220): string {
  const trimmed = text.trim().replace(/\s+/gu, " ");
  if (!trimmed) {
    return "Bel tentativo — migliora un po' la risposta e premi di nuovo Controlla.";
  }

  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function mapFreitextLlmProviderError(
  error: unknown,
): { status: number; message: string; code: string; retryable: boolean } | null {
  const status = readNumeric(error, "status") ?? readNumeric(error, "statusCode");
  const message = readString(error, "message") ?? stringFrom(error) ?? "";
  const lower = message.toLowerCase();

  if (status === 429 || lower.includes("rate limit") || lower.includes("resource_exhausted")) {
    return {
      status: 429,
      code: "RATE_LIMITED",
      retryable: true,
      message: "The scorer is busy — please try Check again shortly.",
    };
  }

  if (status !== null && status >= 500) {
    return {
      status: 503,
      code: "PROVIDER_UNAVAILABLE",
      retryable: true,
      message: "Il valutatore non è disponibile. Riprova.",
    };
  }

  return null;
}

function readNumeric(error: unknown, key: "status" | "statusCode"): number | null {
  if (!error || typeof error !== "object" || !(key in error)) return null;
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

function readString(error: unknown, key: "message"): string | null {
  if (!error || typeof error !== "object" || !(key in error)) return null;
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function stringFrom(error: unknown): string | null {
  return typeof error === "string" ? error : null;
}
