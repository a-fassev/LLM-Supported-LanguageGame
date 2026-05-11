import { z } from "zod";

export const freeTextEvaluationModelSchema = z.object({
  feedback: z.string().min(1),
  criteriaMatched: z.number().int().min(0),
  criteriaTotal: z.number().int().min(1),
  nextStep: z.string().min(1),
});

export const wordGuessEvaluationModelSchema = z.object({
  feedback: z.string().min(1),
  hint: z.string().min(1),
  isCorrect: z.boolean(),
  guessQuality: z.number().min(0).max(1),
});
