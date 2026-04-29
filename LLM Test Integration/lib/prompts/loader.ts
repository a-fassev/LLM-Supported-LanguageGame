import { ChatPromptTemplate } from "@langchain/core/prompts";
import { type ChatPromptValueInterface } from "@langchain/core/prompt_values";
import { type Runnable } from "@langchain/core/runnables";
import * as hub from "langchain/hub/node";

import { getServerEnv } from "@/lib/config/env";
import { localChatPrompt } from "@/lib/prompts/chatPrompt";
import { localEvaluationPrompt } from "@/lib/prompts/evaluationPrompt";

type PromptRunnable = Runnable<Record<string, unknown>, ChatPromptValueInterface>;

let cachedChatPrompt: PromptRunnable | null = null;
let cachedEvalPrompt: PromptRunnable | null = null;

async function pullPrompt(promptId: string): Promise<PromptRunnable | null> {
  try {
    const pulled = await hub.pull<Runnable<Record<string, unknown>, unknown>>(
      promptId,
    );
    if (typeof pulled?.invoke !== "function") {
      return null;
    }
    return pulled as PromptRunnable;
  } catch {
    return null;
  }
}

export async function loadChatPrompt(): Promise<PromptRunnable> {
  if (cachedChatPrompt) {
    return cachedChatPrompt;
  }

  const env = getServerEnv();
  if (env.LANGSMITH_CHAT_PROMPT) {
    const pulledPrompt = await pullPrompt(env.LANGSMITH_CHAT_PROMPT);
    if (pulledPrompt) {
      cachedChatPrompt = pulledPrompt;
      return pulledPrompt;
    }
  }

  cachedChatPrompt = localChatPrompt;
  return cachedChatPrompt;
}

export async function loadEvaluationPrompt(): Promise<PromptRunnable> {
  if (cachedEvalPrompt) {
    return cachedEvalPrompt;
  }

  const env = getServerEnv();
  if (env.LANGSMITH_EVAL_PROMPT) {
    const pulledPrompt = await pullPrompt(env.LANGSMITH_EVAL_PROMPT);
    if (pulledPrompt) {
      cachedEvalPrompt = pulledPrompt;
      return pulledPrompt;
    }
  }

  cachedEvalPrompt = localEvaluationPrompt;
  return cachedEvalPrompt;
}

export function clearPromptCache() {
  cachedChatPrompt = null;
  cachedEvalPrompt = null;
}

export function isLocalPrompt(prompt: PromptRunnable): boolean {
  return prompt instanceof ChatPromptTemplate;
}
