import { ChatPromptTemplate } from "@langchain/core/prompts";

import { getServerEnv } from "@/lib/config/env";
import { createTaskEvalModel } from "@/lib/llm/client";
import {
  freeTextEvaluationModelSchema,
  wordGuessEvaluationModelSchema,
} from "@/lib/llm/taskEvaluationSchema";
import type {
  TaskEvaluationErrorCode,
  TaskEvaluationRequest,
  TaskEvaluationSuccess,
} from "@/lib/types/taskEvaluation";

export class TaskEvaluationServiceError extends Error {
  constructor(
    public readonly code: TaskEvaluationErrorCode,
    public readonly status: number,
    public readonly retryable: boolean,
    message: string,
  ) {
    super(message);
    this.name = "TaskEvaluationServiceError";
  }
}

const freeTextPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "You are a supportive Italian learning coach for children.",
      "Evaluate the learner text against teacher criteria.",
      "Always be constructive, concise, and child-safe.",
      "Never shame the learner and avoid harsh language.",
      "Return only structured output.",
    ].join("\n"),
  ],
  [
    "human",
    [
      "Task prompt: {promptText}",
      "Evaluation criteria: {evaluationCriteria}",
      "Target structures: {targetStructures}",
      "Learner answer: {learnerAnswer}",
    ].join("\n\n"),
  ],
]);

const wordGuessPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "You evaluate a child describing a target Italian word.",
      "Determine whether the guess should count as correct.",
      "Provide a motivating hint and child-safe feedback.",
      "Return only structured output.",
    ].join("\n"),
  ],
  [
    "human",
    [
      "Target word: {targetWord}",
      "Maximum attempts: {maxGuessAttempts}",
      "Current attempt number: {attemptNumber}",
      "Learner description/guess: {learnerAnswer}",
    ].join("\n\n"),
  ],
]);

export async function evaluateTaskSubmission(
  input: TaskEvaluationRequest,
  requestId: string,
): Promise<TaskEvaluationSuccess> {
  const env = getServerEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.LLM_TASK_TIMEOUT_MS);

  try {
    if (input.taskType === "llm_free_text") {
      const result = await evaluateFreeTextTask(input, controller.signal);
      const score = calculateScore(
        input.scoring.policy,
        result.criteriaMatched / Math.max(1, result.criteriaTotal),
        input.scoring.maxPoints,
        input.scoring.passThreshold,
      );
      const ratio = score / input.scoring.maxPoints;
      return {
        requestId,
        taskId: input.taskId,
        taskType: input.taskType,
        isPass: ratio >= input.scoring.passThreshold,
        scoreEarned: score,
        scoreMax: input.scoring.maxPoints,
        feedback: normalizeFeedback(result.feedback),
        details: {
          criteriaMatched: result.criteriaMatched,
          criteriaTotal: result.criteriaTotal,
          nextStep: normalizeFeedback(result.nextStep, 120),
        },
      };
    }

    const wordGuessResult = await evaluateWordGuessTask(input, controller.signal);
    const score = calculateScore(
      input.scoring.policy,
      wordGuessResult.guessQuality,
      input.scoring.maxPoints,
      input.scoring.passThreshold,
    );
    const ratio = score / input.scoring.maxPoints;
    const remainingAttempts = Math.max(
      0,
      input.maxGuessAttempts - input.submission.attemptNumber,
    );
    return {
      requestId,
      taskId: input.taskId,
      taskType: input.taskType,
      isPass: wordGuessResult.isCorrect || ratio >= input.scoring.passThreshold,
      scoreEarned: score,
      scoreMax: input.scoring.maxPoints,
      feedback: normalizeFeedback(wordGuessResult.feedback),
      details: {
        isCorrect: wordGuessResult.isCorrect,
        remainingAttempts,
        hint: normalizeFeedback(wordGuessResult.hint, 120),
      },
    };
  } catch (error) {
    if (error instanceof TaskEvaluationServiceError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new TaskEvaluationServiceError(
        "MODEL_TIMEOUT",
        504,
        true,
        input.taskType === "llm_free_text"
          ? "Model timed out for llm_free_text evaluation."
          : "Model timed out for llm_word_guess evaluation.",
      );
    }

    const mapped = mapProviderError(error);
    if (mapped) {
      throw mapped;
    }

    console.error("Task evaluation service failure:", error);
    throw new TaskEvaluationServiceError(
      "PROVIDER_UNAVAILABLE",
      503,
      true,
      "Der Bewertungsdienst ist aktuell nicht verfuegbar.",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function evaluateFreeTextTask(
  input: Extract<TaskEvaluationRequest, { taskType: "llm_free_text" }>,
  signal: AbortSignal,
) {
  const model = createTaskEvalModel().withStructuredOutput(freeTextEvaluationModelSchema, {
    name: "llm_free_text_feedback",
    strict: true,
  });
  const prompt = await freeTextPrompt.invoke({
    promptText: input.promptText,
    evaluationCriteria: input.evaluationCriteria.join("; "),
    targetStructures: input.targetStructures.join("; "),
    learnerAnswer: input.submission.rawText,
  });

  try {
    const output = await model.invoke(prompt, {
      signal,
      tags: ["feature:task-eval", "mode:llm-free-text"],
      metadata: {
        sessionId: input.sessionId,
        attemptId: input.attemptId,
        levelId: input.levelId,
        taskId: input.taskId,
      },
    });
    return freeTextEvaluationModelSchema.parse(output);
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    const mapped = mapProviderError(error);
    if (mapped) {
      throw mapped;
    }

    throw new TaskEvaluationServiceError(
      "INVALID_MODEL_OUTPUT",
      502,
      true,
      "Die Rueckmeldung war unvollstaendig. Bitte erneut versuchen.",
    );
  }
}

async function evaluateWordGuessTask(
  input: Extract<TaskEvaluationRequest, { taskType: "llm_word_guess" }>,
  signal: AbortSignal,
) {
  const model = createTaskEvalModel().withStructuredOutput(wordGuessEvaluationModelSchema, {
    name: "llm_word_guess_feedback",
    strict: true,
  });
  const prompt = await wordGuessPrompt.invoke({
    targetWord: input.targetWord,
    maxGuessAttempts: input.maxGuessAttempts,
    attemptNumber: input.submission.attemptNumber,
    learnerAnswer: input.submission.rawText,
  });

  try {
    const output = await model.invoke(prompt, {
      signal,
      tags: ["feature:task-eval", "mode:llm-word-guess"],
      metadata: {
        sessionId: input.sessionId,
        attemptId: input.attemptId,
        levelId: input.levelId,
        taskId: input.taskId,
      },
    });
    return wordGuessEvaluationModelSchema.parse(output);
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    const mapped = mapProviderError(error);
    if (mapped) {
      throw mapped;
    }

    throw new TaskEvaluationServiceError(
      "INVALID_MODEL_OUTPUT",
      502,
      true,
      "Die Rueckmeldung war unvollstaendig. Bitte erneut versuchen.",
    );
  }
}

export function calculateScore(
  scoringPolicy: "strict_binary" | "partial_points" | "threshold_pass",
  quality: number,
  maxPoints: number,
  passThreshold: number,
): number {
  const normalizedQuality = Math.min(1, Math.max(0, quality));
  const threshold = Math.min(1, Math.max(0, passThreshold));

  if (scoringPolicy === "strict_binary") {
    return normalizedQuality >= 1 ? maxPoints : 0;
  }

  if (scoringPolicy === "partial_points") {
    return Math.round(normalizedQuality * maxPoints);
  }

  return normalizedQuality >= threshold ? maxPoints : 0;
}

export function normalizeFeedback(text: string, maxLength = 220): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "Gute Anstrengung! Versuche es bitte noch einmal.";
  }

  return trimmed.length <= maxLength
    ? trimmed
    : `${trimmed.slice(0, maxLength - 1)}…`;
}

export function mapProviderError(error: unknown): TaskEvaluationServiceError | null {
  const status = readNumeric(error, "status") ?? readNumeric(error, "statusCode");
  const message = readString(error, "message") ?? stringFrom(error);
  const lowerMessage = message?.toLowerCase() ?? "";

  if (status === 429 || lowerMessage.includes("rate limit")) {
    return new TaskEvaluationServiceError(
      "RATE_LIMITED",
      429,
      true,
      "Der Bewertungsdienst ist gerade ausgelastet. Bitte gleich erneut versuchen.",
    );
  }

  if (status !== null && status >= 500) {
    return new TaskEvaluationServiceError(
      "PROVIDER_UNAVAILABLE",
      503,
      true,
      "Der Bewertungsdienst ist aktuell nicht verfuegbar.",
    );
  }

  return null;
}

function readNumeric(error: unknown, key: "status" | "statusCode"): number | null {
  if (!error || typeof error !== "object" || !(key in error)) {
    return null;
  }

  const value = (error as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

function readString(error: unknown, key: "message"): string | null {
  if (!error || typeof error !== "object" || !(key in error)) {
    return null;
  }

  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function stringFrom(error: unknown): string | null {
  if (typeof error === "string") {
    return error;
  }

  return null;
}
