import { type ChatPromptValueInterface } from "@langchain/core/prompt_values";

import { loadEvaluationPrompt } from "@/lib/prompts/loader";
import { createEvalModel } from "@/lib/llm/client";
import { kpiEvaluationSchema } from "@/lib/llm/evaluationSchema";
import type { EvaluateConversationRequest, LanguageFeedback } from "@/lib/types/evaluation";
import { getLevelConfig, getNpcProfile } from "@/lib/config/npcLevels";

function hasPromptMessages(value: unknown): value is ChatPromptValueInterface {
  return (
    value !== null &&
    typeof value === "object" &&
    "messages" in value &&
    Array.isArray((value as { messages?: unknown[] }).messages)
  );
}

export async function evaluateConversation(
  input: EvaluateConversationRequest,
): Promise<LanguageFeedback> {
  const level = getLevelConfig(input.levelId);
  const npc = getNpcProfile(input.npcId);

  const transcript = input.conversationMessages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const prompt = await loadEvaluationPrompt();
  const promptValue = await prompt.invoke({
    levelLabel: level.label,
    cefrBand: level.cefrBand,
    npcName: npc.name,
    scenarioId: input.scenarioId,
    transcript,
  });
  if (!hasPromptMessages(promptValue)) {
    throw new Error("Loaded evaluation prompt did not return chat messages.");
  }

  const evalModel = createEvalModel().withStructuredOutput(kpiEvaluationSchema, {
    name: "language_feedback",
    strict: true,
  });

  const result = await evalModel.invoke(promptValue, {
    tags: ["feature:npc-chat-kpi", "callType:evaluation"],
    metadata: {
      levelId: input.levelId,
      npcId: input.npcId,
      scenarioId: input.scenarioId,
      sessionId: input.sessionId,
    },
  });

  return kpiEvaluationSchema.parse(result);
}
