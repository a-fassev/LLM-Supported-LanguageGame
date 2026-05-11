import { z } from "zod";

const envSchema = z.object({
  NVIDIA_API_KEY: z.string().min(1, "NVIDIA_API_KEY is required"),
  NVIDIA_BASE_URL: z
    .string()
    .url()
    .default("https://integrate.api.nvidia.com/v1"),
  // Defaults use IDs from https://integrate.api.nvidia.com/v1/models; pick one your key can run.
  NVIDIA_CHAT_MODEL: z.string().min(1).default("meta/llama-3.3-70b-instruct"),
  NVIDIA_EVAL_MODEL: z.string().min(1).default("meta/llama-3.3-70b-instruct"),
  LANGSMITH_TRACING: z
    .string()
    .optional()
    .transform((value) => value ?? "false"),
  LANGSMITH_API_KEY: z.string().optional(),
  LANGSMITH_PROJECT: z.string().optional(),
  LANGSMITH_CHAT_PROMPT: z.string().optional(),
  LANGSMITH_EVAL_PROMPT: z.string().optional(),
});

type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (process.env.NODE_ENV === "development") {
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
