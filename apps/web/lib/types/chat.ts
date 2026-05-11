import { z } from "zod";

export const chatRoleSchema = z.enum(["system", "user", "assistant"]);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().min(1),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const levelConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  cefrBand: z.enum(["A1", "A2", "B1"]),
  learnerGoal: z.string(),
  expectedVocabulary: z.array(z.string()),
});
export type LevelConfig = z.infer<typeof levelConfigSchema>;

export const npcProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  tone: z.string(),
  scenarioHint: z.string(),
  bilingualHintPolicy: z
    .enum(["none", "de-or-en-short-hints"])
    .default("de-or-en-short-hints"),
});
export type NpcProfile = z.infer<typeof npcProfileSchema>;

export const chatRequestSchema = z.object({
  sessionId: z.string().min(1),
  levelId: z.string().min(1),
  npcId: z.string().min(1),
  scenarioId: z.string().min(1),
  userMessage: z.string().min(1),
  conversationMessages: z.array(chatMessageSchema).default([]),
  metadata: z.record(z.string(), z.string()).optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatStreamChunkSchema = z.object({
  token: z.string().optional(),
  done: z.boolean().optional(),
  error: z.string().optional(),
});
export type ChatStreamChunk = z.infer<typeof chatStreamChunkSchema>;
