import { z } from "zod";

const taskTypeSchema = z.enum(["llm_free_text", "llm_word_guess"]);
const scoringPolicySchema = z.enum([
  "strict_binary",
  "partial_points",
  "threshold_pass",
]);

const submissionSchema = z.object({
  rawText: z.string().default(""),
  values: z.array(z.string()).default([]),
  attemptNumber: z.number().int().min(1).default(1),
});

const scoringSchema = z.object({
  policy: scoringPolicySchema,
  maxPoints: z.number().int().min(1),
  passThreshold: z.number().min(0).max(1),
});

const sharedRequestSchema = z.object({
  contractVersion: z.literal(1),
  sessionId: z.string().min(1),
  attemptId: z.string().min(1),
  levelId: z.string().min(1),
  taskId: z.string().min(1),
  promptText: z.string().min(1),
  taskType: taskTypeSchema,
  submission: submissionSchema,
  scoring: scoringSchema,
});

export const llmFreeTextTaskRequestSchema = sharedRequestSchema.extend({
  taskType: z.literal("llm_free_text"),
  evaluationCriteria: z.array(z.string().min(1)).min(1),
  targetStructures: z.array(z.string()),
});

export const llmWordGuessTaskRequestSchema = sharedRequestSchema.extend({
  taskType: z.literal("llm_word_guess"),
  targetWord: z.string().min(1),
  maxGuessAttempts: z.number().int().min(1),
});

export const taskEvaluationRequestSchema = z.discriminatedUnion("taskType", [
  llmFreeTextTaskRequestSchema,
  llmWordGuessTaskRequestSchema,
]);

const freeTextDetailsSchema = z.object({
  criteriaMatched: z.number().int().min(0),
  criteriaTotal: z.number().int().min(1),
  nextStep: z.string().min(1),
});

const wordGuessDetailsSchema = z.object({
  isCorrect: z.boolean(),
  remainingAttempts: z.number().int().min(0),
  hint: z.string().min(1),
});

export const taskEvaluationSuccessSchema = z.object({
  requestId: z.string().min(1),
  taskId: z.string().min(1),
  taskType: taskTypeSchema,
  isPass: z.boolean(),
  scoreEarned: z.number().int().min(0),
  scoreMax: z.number().int().min(1),
  feedback: z.string().min(1),
  details: z.union([freeTextDetailsSchema, wordGuessDetailsSchema]).optional(),
});

export const taskEvaluationErrorCodeSchema = z.enum([
  "INVALID_JSON",
  "PAYLOAD_INVALID",
  "UNAUTHORIZED",
  "MODEL_TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "RATE_LIMITED",
  "INVALID_MODEL_OUTPUT",
  "INTERNAL_ERROR",
]);

export const taskEvaluationErrorSchema = z.object({
  requestId: z.string().min(1),
  code: taskEvaluationErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
});

export type TaskEvaluationRequest = z.infer<typeof taskEvaluationRequestSchema>;
export type TaskEvaluationSuccess = z.infer<typeof taskEvaluationSuccessSchema>;
export type TaskEvaluationErrorCode = z.infer<typeof taskEvaluationErrorCodeSchema>;
