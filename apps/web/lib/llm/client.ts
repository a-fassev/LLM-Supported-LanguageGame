import { ChatOpenAI } from "@langchain/openai";

import { getServerEnv } from "@/lib/config/env";

function createBaseModel(
  modelName: string,
  temperature: number,
  options: { timeoutMs: number; maxRetries: number },
) {
  const env = getServerEnv();

  return new ChatOpenAI({
    model: modelName,
    temperature,
    apiKey: env.NVIDIA_API_KEY,
    streamUsage: false,
    ...(options.timeoutMs > 0 ? { timeout: options.timeoutMs } : {}),
    maxRetries: options.maxRetries,
    configuration: {
      baseURL: env.NVIDIA_BASE_URL,
    },
  });
}

export function createTaskEvalModel() {
  const env = getServerEnv();
  return createBaseModel(env.NVIDIA_EVAL_MODEL, 0.2, {
    timeoutMs: env.LLM_TASK_TIMEOUT_MS,
    maxRetries: env.LLM_TASK_MAX_RETRIES,
  });
}
