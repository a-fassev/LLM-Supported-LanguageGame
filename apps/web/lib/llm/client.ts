import { ChatOpenAI } from "@langchain/openai";

import { getServerEnv } from "@/lib/config/env";

function createBaseModel(modelName: string, temperature: number) {
  const env = getServerEnv();

  return new ChatOpenAI({
    model: modelName,
    temperature,
    apiKey: env.NVIDIA_API_KEY,
    streamUsage: false,
    configuration: {
      baseURL: env.NVIDIA_BASE_URL,
    },
  });
}

export function createChatModel() {
  const env = getServerEnv();
  return createBaseModel(env.NVIDIA_CHAT_MODEL, 0.5);
}

export function createEvalModel() {
  const env = getServerEnv();
  return createBaseModel(env.NVIDIA_EVAL_MODEL, 0.2);
}
