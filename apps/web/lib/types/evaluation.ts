import { z } from "zod";

export const kpiBandSchema = z.enum(["needs_support", "developing", "secure"]);

export const kpiScoreSchema = z.object({
  value: z.number().min(0).max(100),
  band: kpiBandSchema,
  rationale: z.string().min(1),
});

export const languageFeedbackSchema = z.object({
  summary: z.string().min(1),
  grammar: kpiScoreSchema,
  vocabulary: kpiScoreSchema,
  fluency: kpiScoreSchema,
  comprehension: kpiScoreSchema,
  strengths: z.array(z.string()).min(1).max(5),
  mistakes: z
    .array(
      z.object({
        issue: z.string().min(1),
        suggestion: z.string().min(1),
        correctedExample: z.string().min(1),
      }),
    )
    .max(6),
  encouragingNextSteps: z.array(z.string()).min(2).max(5),
  coachMessageForChild: z.string().min(1),
});

export const evaluateConversationRequestSchema = z.object({
  sessionId: z.string().min(1),
  levelId: z.string().min(1),
  npcId: z.string().min(1),
  scenarioId: z.string().min(1),
  conversationMessages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

export type KpiScore = z.infer<typeof kpiScoreSchema>;
export type LanguageFeedback = z.infer<typeof languageFeedbackSchema>;
export type EvaluateConversationRequest = z.infer<
  typeof evaluateConversationRequestSchema
>;
