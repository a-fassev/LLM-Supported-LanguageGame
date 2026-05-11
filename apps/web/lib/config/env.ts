import { z } from "zod";

const envSchema = z.object({
  NVIDIA_API_KEY: z.string().min(1, "NVIDIA_API_KEY is required"),
  NVIDIA_BASE_URL: z
    .string()
    .url()
    .default("https://integrate.api.nvidia.com/v1"),
  // Defaults use IDs from https://integrate.api.nvidia.com/v1/models; pick one your key can run.
  NVIDIA_EVAL_MODEL: z.string().min(1).default("meta/llama-3.3-70b-instruct"),
  LLM_TASK_TIMEOUT_MS: z.coerce.number().int().min(1000).default(12000),
  LLM_TASK_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
  /** When non-empty, POST /api/tasks/evaluate requires header `x-task-eval-api-key` to match. */
  TASK_EVAL_API_KEY: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string(),
  ),
  LANGSMITH_TRACING: z
    .string()
    .optional()
    .transform((value) => value ?? "false"),
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().optional(),
});

type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    cachedEnv = null;
  }
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.issues
        .map((issue) => issue.message)
        .join(", ")}`,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
