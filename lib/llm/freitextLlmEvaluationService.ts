import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

import type { FreitextLlmStepContentParsed } from "@/lib/llm/freitextLlmContentSchema";
import type { FreitextLlmEvaluatorEnv } from "@/lib/llm/freitextLlmEnv";
import { gameClientMessages as msg } from "@/lib/game/clientMessages";
import {
  freitextLlmStructuredOutputSchema,
} from "@/lib/llm/freitextLlmModelSchema";

function createFreitextModel(env: FreitextLlmEvaluatorEnv) {
  return new ChatOpenAI({
    model: env.openaiModel,
    apiKey: env.openaiApiKey,
    temperature: 0.2,
    maxRetries: env.llmMaxRetries,
    ...(env.llmTimeoutMs > 0 ? { timeout: env.llmTimeoutMs } : {}),
  });
}

const freitextJudgePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "You evaluate short written learner answers for classroom Italian practice.",
      "Learners attend a gifted-education school and are still learning — reward genuine effort and communicative success.",
      "",
      "STEP 1 — Non-attempt check (before scoring).",
      "Set ALL four scores to 0 only when the answer is clearly not a real attempt:",
      "- empty text, random gibberish, or copied filler with no Italian content;",
      "- no Italian at all (entirely in another language).",
      "Do NOT zero scores for: a short but meaningful Italian answer; minor German/English words mixed into mostly Italian text;",
      "imperfect grammar; missing optional details; or only partial use of target structures — score those in STEP 2 instead.",
      "",
      "STEP 2 — Score FOUR independent dimensions on a continuous 0..1 interval:",
      "- taskFulfillmentScore: does the answer address the core intent of the prompt and instruction?",
      "  Reward a plausible, on-topic attempt even when scope is thin or some criteria are only partly met (0.5–0.75 is fine).",
      "- vocabularyScore: use of target structures and task vocabulary when present.",
      "  Give partial credit when structures appear in a recognizable form; do not require every listed structure.",
      "- grammarScore: is the Italian understandable? Minor morphology/spelling errors should lower the score slightly, not collapse it.",
      "- registerScore: general fit of tone vs the register target; only penalize clearly wrong formality when register matters for the task.",
      "",
      "Scoring principles (be generous):",
      "- Understandability outweighs perfection. A B1 learner who communicates the main idea deserves at least ~0.6 on grammar when meaning is clear.",
      "- Missing one target structure or criterion should reduce the relevant dimension, not invalidate the whole answer.",
      "- Be lenient on grammar/vocabulary the task has not explicitly taught.",
      "- Reserve scores below 0.4 for answers that are hard to understand or clearly off-topic — not for small mistakes.",
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

  const model = createFreitextModel(env).withStructuredOutput(
    freitextLlmStructuredOutputSchema,
    {
      method: "jsonSchema",
      strict: true,
      name: "freitext_judge",
    },
  );

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

  if (
    status === 429 ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit_exceeded")
  ) {
    return {
      status: 429,
      code: "RATE_LIMITED",
      retryable: true,
      message: msg.llmRateLimited,
    };
  }

  if (
    status === 401 ||
    lower.includes("invalid api key") ||
    lower.includes("incorrect api key")
  ) {
    return {
      status: 503,
      code: "evaluator_unavailable",
      retryable: false,
      message: msg.freitextEvaluatorError,
    };
  }

  if (status !== null && status >= 500) {
    return {
      status: 503,
      code: "PROVIDER_UNAVAILABLE",
      retryable: true,
      message: msg.freitextEvaluatorError,
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
