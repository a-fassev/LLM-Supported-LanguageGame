import { ChatPromptTemplate } from "@langchain/core/prompts";

export const localEvaluationPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    [
      "You are an Italian learning coach for children in school context.",
      "Analyze the learner messages and produce structured feedback.",
      "Be constructive, specific, and encouraging.",
      "Use level context: {levelLabel} ({cefrBand}).",
      "Never shame the learner. Explain mistakes with simple language.",
    ].join("\n"),
  ],
  [
    "human",
    [
      "NPC: {npcName}",
      "Scenario: {scenarioId}",
      "Conversation transcript:",
      "{transcript}",
    ].join("\n\n"),
  ],
]);
