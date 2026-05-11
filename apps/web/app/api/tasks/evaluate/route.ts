import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getServerEnv } from "@/lib/config/env";
import {
  evaluateTaskSubmission,
  TaskEvaluationServiceError,
} from "@/lib/llm/taskEvaluationService";
import {
  taskEvaluationRequestSchema,
  type TaskEvaluationErrorCode,
  type TaskEvaluationRequest,
  type TaskEvaluationSuccess,
} from "@/lib/types/taskEvaluation";

export async function POST(request: Request) {
  return handleTaskEvaluationPost(request);
}

type TaskEvaluationDeps = {
  createRequestId: () => string;
  authorize: (request: Request) => void;
  parsePayload: (body: unknown) => TaskEvaluationRequest;
  evaluate: (
    payload: TaskEvaluationRequest,
    requestId: string,
  ) => Promise<TaskEvaluationSuccess>;
};

const defaultDeps: TaskEvaluationDeps = {
  createRequestId: () => crypto.randomUUID(),
  authorize: assertTaskEvalApiKey,
  parsePayload: (body) => taskEvaluationRequestSchema.parse(body),
  evaluate: evaluateTaskSubmission,
};

export function assertTaskEvalApiKey(request: Request): void {
  const expected = getServerEnv().TASK_EVAL_API_KEY.trim();
  if (!expected) {
    return;
  }

  const provided = request.headers.get("x-task-eval-api-key")?.trim() ?? "";
  if (!timingSafeStringEqual(provided, expected)) {
    throw new TaskEvaluationServiceError(
      "UNAUTHORIZED",
      401,
      false,
      "Missing or invalid task evaluation API key.",
    );
  }
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function handleTaskEvaluationPost(
  request: Request,
  deps: TaskEvaluationDeps = defaultDeps,
) {
  const requestId = deps.createRequestId();

  try {
    deps.authorize(request);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        buildErrorResponse(
          requestId,
          "INVALID_JSON",
          "Request body must be valid JSON.",
          false,
        ),
        { status: 400 },
      );
    }
    const payload = deps.parsePayload(body);
    const result = await deps.evaluate(payload, requestId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        buildErrorResponse(
          requestId,
          "PAYLOAD_INVALID",
          "Invalid task evaluation payload.",
          false,
        ),
        { status: 422 },
      );
    }

    if (error instanceof TaskEvaluationServiceError) {
      return NextResponse.json(
        buildErrorResponse(requestId, error.code, error.message, error.retryable),
        { status: error.status },
      );
    }

    console.error("Task evaluation route failure:", error);
    return NextResponse.json(
      buildErrorResponse(
        requestId,
        "INTERNAL_ERROR",
        "Task evaluation is temporarily unavailable.",
        true,
      ),
      { status: 500 },
    );
  }
}

function buildErrorResponse(
  requestId: string,
  code: TaskEvaluationErrorCode,
  message: string,
  retryable: boolean,
) {
  return {
    requestId,
    code,
    message,
    retryable,
  };
}
