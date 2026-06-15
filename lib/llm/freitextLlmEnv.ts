const DEFAULT_OPENAI_EVAL_MODEL = "gpt-5.4-nano-2026-03-17";

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Lazy env for FreitextLlm evaluator (avoids crashing Next imports when OpenAI is not configured). */
export type FreitextLlmEvaluatorEnv = {
  openaiModel: string;
  openaiApiKey: string;
  llmTimeoutMs: number;
  llmMaxRetries: number;
};

export function resolveFreitextLlmEvaluatorEnv(): FreitextLlmEvaluatorEnv | null {
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const openaiModel = process.env.OPENAI_EVAL_MODEL?.trim() || DEFAULT_OPENAI_EVAL_MODEL;
  const llmTimeoutMs = parsePositiveInt(process.env.LLM_TASK_TIMEOUT_MS, 45_000);
  const llmMaxRetries = Math.max(0, parsePositiveInt(process.env.LLM_TASK_MAX_RETRIES, 2));

  if (!openaiApiKey) return null;

  return {
    openaiModel,
    openaiApiKey,
    llmTimeoutMs,
    llmMaxRetries,
  };
}
