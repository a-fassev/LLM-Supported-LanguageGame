function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Lazy env for FreitextLlm evaluator (avoids crashing Next imports when NVIDIA is not configured). */
export type FreitextLlmEvaluatorEnv = {
  nvidiaApiKey: string;
  nvidiaBaseUrl: string;
  nvidiaEvalModel: string;
  llmTimeoutMs: number;
  llmMaxRetries: number;
  gateTtlMinutes: number;
};

export function resolveFreitextLlmEvaluatorEnv(): FreitextLlmEvaluatorEnv | null {
  const nvidiaApiKey = process.env.NVIDIA_API_KEY?.trim() ?? "";
  const nvidiaBaseUrl =
    process.env.NVIDIA_BASE_URL?.trim() || process.env.NIM_BASE_URL?.trim() || "";

  const nvidiaEvalModel = process.env.NVIDIA_EVAL_MODEL?.trim();
  const llmTimeoutMs = parsePositiveInt(process.env.LLM_TASK_TIMEOUT_MS, 45_000);
  const llmMaxRetries = Math.max(0, parsePositiveInt(process.env.LLM_TASK_MAX_RETRIES, 2));

  const gateTtlMinutes = parsePositiveInt(process.env.FREITEXT_LLM_GATE_TTL_MINUTES, 25);

  if (!nvidiaApiKey || !nvidiaBaseUrl || !nvidiaEvalModel) return null;

  return {
    nvidiaApiKey,
    nvidiaBaseUrl,
    nvidiaEvalModel,
    llmTimeoutMs,
    llmMaxRetries,
    gateTtlMinutes,
  };
}
