import assert from "node:assert/strict";
import test from "node:test";

import {
  assertTaskEvalApiKey,
  handleTaskEvaluationPost,
} from "../app/api/tasks/evaluate/route";
import { TaskEvaluationServiceError } from "../lib/llm/taskEvaluationService";
import { taskEvaluationRequestSchema } from "../lib/types/taskEvaluation";

const validFreeTextPayload = {
  contractVersion: 1 as const,
  sessionId: "session-1",
  attemptId: "attempt-1",
  levelId: "level-1",
  taskId: "task-1",
  promptText: "Beschreibe deinen Schultag.",
  taskType: "llm_free_text" as const,
  submission: {
    rawText: "Io vado a scuola.",
    values: [],
    attemptNumber: 1,
  },
  scoring: {
    policy: "threshold_pass" as const,
    maxPoints: 5,
    passThreshold: 0.6,
  },
  evaluationCriteria: ["Struktur", "Wortschatz"],
  targetStructures: ["presente"],
};

test("handleTaskEvaluationPost returns 400 for malformed JSON", async () => {
  const response = await handleTaskEvaluationPost(
    new Request("http://localhost/api/tasks/evaluate", {
      method: "POST",
      body: "{ not valid json",
    }),
    {
      createRequestId: () => "req-json",
      authorize: () => {},
      parsePayload: (body) => taskEvaluationRequestSchema.parse(body),
      evaluate: async () => {
        throw new Error("should not be called");
      },
    },
  );

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, "INVALID_JSON");
  assert.equal(body.retryable, false);
});

test("handleTaskEvaluationPost returns success payload", async () => {
  const response = await handleTaskEvaluationPost(
    new Request("http://localhost/api/tasks/evaluate", {
      method: "POST",
      body: JSON.stringify(validFreeTextPayload),
    }),
    {
      createRequestId: () => "req-success",
      authorize: () => {},
      parsePayload: (body) => taskEvaluationRequestSchema.parse(body),
      evaluate: async () => ({
        requestId: "req-success",
        taskId: "task-1",
        taskType: "llm_free_text",
        isPass: true,
        scoreEarned: 4,
        scoreMax: 5,
        feedback: "Gut gemacht!",
        details: {
          criteriaMatched: 2,
          criteriaTotal: 2,
          nextStep: "Versuche laengere Saetze.",
        },
      }),
    },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.requestId, "req-success");
  assert.equal(body.feedback, "Gut gemacht!");
});

test("handleTaskEvaluationPost returns 422 for payload errors", async () => {
  const response = await handleTaskEvaluationPost(
    new Request("http://localhost/api/tasks/evaluate", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" }),
    }),
    {
      createRequestId: () => "req-payload",
      authorize: () => {},
      parsePayload: (body) => taskEvaluationRequestSchema.parse(body),
      evaluate: async () => {
        throw new Error("should not be called");
      },
    },
  );

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.code, "PAYLOAD_INVALID");
  assert.equal(body.retryable, false);
});

test("handleTaskEvaluationPost maps service errors to status and envelope", async () => {
  const cases = [
    ["UNAUTHORIZED", 401, false],
    ["MODEL_TIMEOUT", 504, true],
    ["PROVIDER_UNAVAILABLE", 503, true],
    ["RATE_LIMITED", 429, true],
    ["INVALID_MODEL_OUTPUT", 502, true],
    ["INTERNAL_ERROR", 500, true],
  ] as const;

  for (const [code, status, retryable] of cases) {
    const response = await handleTaskEvaluationPost(
      new Request("http://localhost/api/tasks/evaluate", {
        method: "POST",
        body: JSON.stringify(validFreeTextPayload),
      }),
      {
        createRequestId: () => `req-${code}`,
        authorize: () => {},
        parsePayload: (body) => taskEvaluationRequestSchema.parse(body),
        evaluate: async () => {
          throw new TaskEvaluationServiceError(
            code,
            status,
            retryable,
            `diagnostic-${code}`,
          );
        },
      },
    );

    assert.equal(response.status, status);
    const body = await response.json();
    assert.equal(body.code, code);
    assert.equal(body.retryable, retryable);
    assert.equal(body.requestId, `req-${code}`);
  }
});

test("assertTaskEvalApiKey returns 401 when header does not match env", async () => {
  const prevEvalKey = process.env.TASK_EVAL_API_KEY;
  const prevNvidia = process.env.NVIDIA_API_KEY;
  process.env.TASK_EVAL_API_KEY = "expected-secret";
  process.env.NVIDIA_API_KEY = prevNvidia ?? "test-key";

  try {
    const response = await handleTaskEvaluationPost(
      new Request("http://localhost/api/tasks/evaluate", {
        method: "POST",
        headers: { "x-task-eval-api-key": "wrong" },
        body: JSON.stringify(validFreeTextPayload),
      }),
      {
        createRequestId: () => "req-auth",
        authorize: assertTaskEvalApiKey,
        parsePayload: (body) => taskEvaluationRequestSchema.parse(body),
        evaluate: async () => {
          throw new Error("should not be called when unauthorized");
        },
      },
    );

    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.code, "UNAUTHORIZED");
    assert.equal(body.retryable, false);
  } finally {
    if (prevEvalKey === undefined) {
      delete process.env.TASK_EVAL_API_KEY;
    } else {
      process.env.TASK_EVAL_API_KEY = prevEvalKey;
    }
    if (prevNvidia === undefined) {
      delete process.env.NVIDIA_API_KEY;
    } else {
      process.env.NVIDIA_API_KEY = prevNvidia;
    }
  }
});
