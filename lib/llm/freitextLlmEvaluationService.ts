import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

import type { FreitextLlmStepContentParsed } from "@/lib/llm/freitextLlmContentSchema";
import type { FreitextLlmEvaluatorEnv } from "@/lib/llm/freitextLlmEnv";
import {
  freitextLlmStructuredOutputSchema,
} from "@/lib/llm/freitextLlmModelSchema";

function createFreitextModel(env: FreitextLlmEvaluatorEnv) {
  return new ChatOpenAI({
    model: env.nvidiaEvalModel,
    temperature: 0.2,
    apiKey: env.nvidiaApiKey,
    streamUsage: false,
    ...(env.llmTimeoutMs > 0 ? { timeout: env.llmTimeoutMs } : {}),
    maxRetries: env.llmMaxRetries,
    configuration: {
      baseURL: env.nvidiaBaseUrl,
    },
  });
}

const freitextJudgePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "You evaluate short written learner answers for classroom Italian practice.",
      "Learners attend a gifted-education school; multilingual answers are acceptable for explanations.",
      "Score THREE independent dimensions on a continuous 0..1 interval:",
      "- grammarScore: morphology, agreement, tense, completeness of Italian sentence(s).",
      "- vocabularyScore: appropriateness, precision, lexical range for intended meaning.",
      "- registerScore: fit of tone (formality, politeness) vs communicated register target.",
      "Be concise, factual, motivational, and child-safe.",
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
      "Learner answer:",
      "{answer}",
    ].join("\n"),
  ],
]);

export async function invokeFreitextLlmJudge(
  content: FreitextLlmStepContentParsed,
  learnerAnswer: string,
  env: FreitextLlmEvaluatorEnv,
  signal: AbortSignal,
) {
  const model = createFreitextModel(env).withStructuredOutput(freitextLlmStructuredOutputSchema, {
    name: "freitext_llm_judge",
    strict: true,
  });

  const instruction = content.instruction?.trim() ?? "";
  const criteria = content.evaluation.evaluationCriteria.join("; ");
  const structures = content.evaluation.targetStructures.join("; ");

  const registerTarget =
    typeof content.evaluation.registerTarget === "string"
      ? content.evaluation.registerTarget
      : "neutral";

  const invoked = await freitextJudgePrompt.invoke({
    prompt: content.prompt.trim(),
    instruction: instruction === "" ? "(none)" : instruction,
    targetLanguage: content.targetLanguage?.trim() || "unspecified",
    registerTarget,
    criteria,
    targetStructures: structures === "" ? "(none supplied)" : structures,
    answer: learnerAnswer.trim(),
  });

  const chat = await model.invoke(invoked, {
    signal,
    tags: ["feature:freitext-llm", "surface:learning-game"],
    metadata: {
      targetLanguageTag: content.targetLanguage ?? "",
    },
  });

  return freitextLlmStructuredOutputSchema.parse(chat);
}

export type WeightInput = Pick<
  FreitextLlmStepContentParsed["evaluation"],
  "grammarWeight" | "vocabularyWeight" | "registerWeight"
>;

export function weightedSkillRatio(
  weights: WeightInput,
  grammarScore: number,
  vocabScore: number,
  registerScore: number,
): number {
  const denom = weights.grammarWeight + weights.vocabularyWeight + weights.registerWeight;
  if (!(denom > 0)) return 0;
  const weighted =
    (weights.grammarWeight * grammarScore +
      weights.vocabularyWeight * vocabScore +
      weights.registerWeight * registerScore) /
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
  if (!trimmed) return "Nice effort — try tweaking your answer slightly and press Check again.";

  return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function mapFreitextLlmProviderError(
  error: unknown,
): { status: number; message: string; code: string; retryable: boolean } | null {
  const status = readNumeric(error, "status") ?? readNumeric(error, "statusCode");
  const message = readString(error, "message") ?? stringFrom(error) ?? "";
  const lower = message.toLowerCase();

  if (status === 429 || lower.includes("rate limit")) {
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
