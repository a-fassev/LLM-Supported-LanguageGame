import { createAgent, summarizationMiddleware } from "langchain";
import { AIMessage, type MessageContent, type MessageContentComplex } from "@langchain/core/messages";
import { type ChatPromptValueInterface } from "@langchain/core/prompt_values";
import { type StreamEvent } from "@langchain/core/tracers/log_stream";

import { getLevelConfig, getNpcProfile } from "@/lib/config/npcLevels";
import { createChatModel } from "@/lib/llm/client";
import { loadChatPrompt } from "@/lib/prompts/loader";
import type { ChatRequest } from "@/lib/types/chat";

function normalizeContentBlock(block: MessageContentComplex): string {
  if ("text" in block && typeof block.text === "string") {
    return block.text;
  }
  return "";
}

function contentToText(content: MessageContent): string {
  if (typeof content === "string") {
    return content;
  }
  return content.map(normalizeContentBlock).join("");
}

function eventToToken(event: StreamEvent): string {
  if (event.event !== "on_chat_model_stream") {
    return "";
  }

  const chunk = (event.data as { chunk?: { content?: MessageContent } })?.chunk;
  if (!chunk?.content) {
    return "";
  }

  return contentToText(chunk.content);
}

function hasUserTurn(messages: ChatRequest["conversationMessages"]): boolean {
  return messages.some((message) => message.role === "user");
}

function hasPromptMessages(value: unknown): value is ChatPromptValueInterface {
  return (
    value !== null &&
    typeof value === "object" &&
    "messages" in value &&
    Array.isArray((value as { messages?: unknown[] }).messages)
  );
}

export async function* streamNpcResponse(
  input: ChatRequest,
): AsyncGenerator<string> {
  const level = getLevelConfig(input.levelId);
  const npc = getNpcProfile(input.npcId);
  const prompt = await loadChatPrompt();

  const promptValue = await prompt.invoke({
    npcName: npc.name,
    levelLabel: level.label,
    cefrBand: level.cefrBand,
    learnerGoal: level.learnerGoal,
    scenarioHint: npc.scenarioHint,
    conversationHistory: input.conversationMessages.map((message) => [
      message.role === "user" ? "human" : message.role,
      message.content,
    ]),
    userMessage: input.userMessage,
  });
  if (!hasPromptMessages(promptValue)) {
    throw new Error("Loaded chat prompt did not return chat messages.");
  }
  const baseMessages = promptValue.messages;

  const agent = createAgent({
    model: createChatModel(),
    tools: [],
    middleware: [
      summarizationMiddleware({
        model: createChatModel(),
        trigger: { messages: 12 },
        keep: { messages: 8 },
      }),
    ],
  });

  const stream = agent.streamEvents(
    {
      messages: baseMessages,
    },
    {
      version: "v2",
      configurable: {
        thread_id: input.sessionId,
        levelId: input.levelId,
        npcId: input.npcId,
        scenarioId: input.scenarioId,
      },
    },
  );

  let streamedAnyToken = false;
  for await (const event of stream) {
    const token = eventToToken(event);
    if (!token) {
      continue;
    }

    streamedAnyToken = true;
    yield token;
  }

  // Fallback: if the provider did not emit token events, return a full response.
  if (!streamedAnyToken) {
    const result = await agent.invoke(
      {
        messages: baseMessages,
      },
      {
        configurable: {
          thread_id: input.sessionId,
        },
      },
    );

    const latestAssistantMessage = [...result.messages]
      .reverse()
      .find((message): message is AIMessage => message._getType() === "ai");

    if (latestAssistantMessage) {
      yield contentToText(latestAssistantMessage.content);
    } else if (!hasUserTurn(input.conversationMessages)) {
      yield "Ciao! Iniziamo con una domanda semplice in italiano.";
    }
  }
}
