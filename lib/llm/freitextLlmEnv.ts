const DEFAULT_GEMINI_EVAL_MODEL = "gemini-3.5-flash";
const GEMINI_API_KEY_SLOT_COUNT = 4;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Lazy env for FreitextLlm evaluator (avoids crashing Next imports when Gemini is not configured). */
export type FreitextLlmEvaluatorEnv = {
  geminiModel: string;
  geminiApiKeys: string[];
  llmTimeoutMs: number;
  llmMaxRetries: number;
};

export function parseGeminiApiKeysFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const keys: string[] = [];
  for (let slot = 1; slot <= GEMINI_API_KEY_SLOT_COUNT; slot++) {
    const value = env[`GEMINI_API_KEY_${slot}`]?.trim();
    if (value) keys.push(value);
  }
  return keys;
}

export function resolveFreitextLlmEvaluatorEnv(): FreitextLlmEvaluatorEnv | null {
  const geminiApiKeys = parseGeminiApiKeysFromEnv();
  const geminiModel = process.env.GEMINI_EVAL_MODEL?.trim() || DEFAULT_GEMINI_EVAL_MODEL;
  const llmTimeoutMs = parsePositiveInt(process.env.LLM_TASK_TIMEOUT_MS, 45_000);
  const llmMaxRetries = Math.max(0, parsePositiveInt(process.env.LLM_TASK_MAX_RETRIES, 2));

  if (geminiApiKeys.length === 0) return null;

  return {
    geminiModel,
    geminiApiKeys,
    llmTimeoutMs,
    llmMaxRetries,
  };
}
