import { z } from "zod";

export const freitextAttemptSchema = z.object({
  taskType: z.literal("FreitextLlm"),
  freitextLlm: z.object({
    answerText: z.string(),
  }),
});

export type FreitextAttempt = z.infer<typeof freitextAttemptSchema>;

export function buildFreitextAttempt(answerText: string): FreitextAttempt {
  return {
    taskType: "FreitextLlm",
    freitextLlm: { answerText },
  };
}

export function parseFreitextAttempt(raw: unknown):
  | { ok: true; answerText: string }
  | { ok: false } {
  const parsed = freitextAttemptSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false };
  }
  return { ok: true, answerText: parsed.data.freitextLlm.answerText };
}
