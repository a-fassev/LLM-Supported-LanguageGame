import test from "node:test";
import assert from "node:assert/strict";

import {
  taskEvaluationErrorSchema,
  taskEvaluationRequestSchema,
  taskEvaluationSuccessSchema,
} from "../lib/types/taskEvaluation";

test("taskEvaluationRequestSchema accepts llm_free_text payload", () => {
  const parsed = taskEvaluationRequestSchema.parse({
    contractVersion: 1,
    sessionId: "s1",
    attemptId: "a1",
    levelId: "level_1",
    taskId: "task_1",
    promptText: "Beschreibe deinen Tag auf Italienisch.",
    taskType: "llm_free_text",
    submission: {
      rawText: "Oggi vado a scuola.",
      values: [],
      attemptNumber: 1,
    },
    scoring: {
      policy: "threshold_pass",
      maxPoints: 5,
      passThreshold: 0.6,
    },
    evaluationCriteria: ["Vergangenheitsform", "Satzbau"],
    targetStructures: ["passato prossimo"],
  });

  assert.equal(parsed.taskType, "llm_free_text");
});

test("taskEvaluationRequestSchema rejects missing llm_word_guess targetWord", () => {
  assert.throws(() => {
    taskEvaluationRequestSchema.parse({
      contractVersion: 1,
      sessionId: "s1",
      attemptId: "a1",
      levelId: "level_1",
      taskId: "task_2",
      promptText: "Errate das Wort.",
      taskType: "llm_word_guess",
      submission: {
        rawText: "E una cosa che mangi.",
        values: [],
        attemptNumber: 1,
      },
      scoring: {
        policy: "strict_binary",
        maxPoints: 3,
        passThreshold: 1,
      },
      maxGuessAttempts: 3,
    });
  });
});

test("taskEvaluationSuccessSchema accepts llm_free_text details", () => {
  const parsed = taskEvaluationSuccessSchema.parse({
    requestId: "req-1",
    taskId: "task-1",
    taskType: "llm_free_text",
    isPass: true,
    scoreEarned: 4,
    scoreMax: 5,
    feedback: "Gute Antwort mit richtiger Struktur.",
    details: {
      criteriaMatched: 3,
      criteriaTotal: 4,
      nextStep: "Nutze beim naechsten Mal noch mehr Verben.",
    },
  });

  assert.equal(parsed.taskType, "llm_free_text");
});

test("taskEvaluationSuccessSchema accepts llm_word_guess details", () => {
  const parsed = taskEvaluationSuccessSchema.parse({
    requestId: "req-2",
    taskId: "task-2",
    taskType: "llm_word_guess",
    isPass: false,
    scoreEarned: 1,
    scoreMax: 3,
    feedback: "Fast richtig, versuche es nochmal.",
    details: {
      isCorrect: false,
      remainingAttempts: 1,
      hint: "Es ist ein Tier.",
    },
  });

  assert.equal(parsed.taskType, "llm_word_guess");
});

test("taskEvaluationErrorSchema accepts all supported codes", () => {
  const codes = [
    "INVALID_JSON",
    "PAYLOAD_INVALID",
    "UNAUTHORIZED",
    "MODEL_TIMEOUT",
    "PROVIDER_UNAVAILABLE",
    "RATE_LIMITED",
    "INVALID_MODEL_OUTPUT",
    "INTERNAL_ERROR",
  ] as const;

  for (const code of codes) {
    const parsed = taskEvaluationErrorSchema.parse({
      requestId: "req-3",
      code,
      message: "diagnostic",
      retryable: true,
    });
    assert.equal(parsed.code, code);
  }
});
