import { z } from "zod";

/** Structured-output contract returned by NVIDIA / OpenAI-compatible chat completion. */
export const freitextLlmStructuredOutputSchema = z.object({
  summaryFeedback: z.string().min(1),
  grammarScore: z.number().min(0).max(1),
  vocabularyScore: z.number().min(0).max(1),
  registerScore: z.number().min(0).max(1),
  taskFulfillmentScore: z.number().min(0).max(1),
  grammarFeedback: z.string().min(1),
  vocabularyFeedback: z.string().min(1),
  registerFeedback: z.string().min(1),
  taskFulfillmentFeedback: z.string().min(1),
  nextStepAdvice: z.string().min(1),
});
