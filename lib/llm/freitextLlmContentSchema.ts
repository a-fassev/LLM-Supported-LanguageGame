import { z } from "zod";
import { optionalSceneBackgroundAssetSchema } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

const scoringPolicySchema = z.enum(["strict_binary", "partial_points", "threshold_pass"]);

const evaluationSchema = z.object({
  grammarWeight: z.number().positive(),
  vocabularyWeight: z.number().positive(),
  registerWeight: z.number().positive(),
  /** Weight for taskFulfillmentScore in the performance ratio (defaults to 1). */
  taskFulfillmentWeight: z.number().positive().optional(),
  passThreshold: z.number().min(0).max(1),
  registerTarget: z.enum(["neutral", "informal", "formal"]).optional(),
  scoringPolicy: scoringPolicySchema.default("threshold_pass"),
  maxPoints: z.number().int().min(1).default(5),
  evaluationCriteria: z.array(z.string().min(1)).optional(),
  targetStructures: z.array(z.string()).optional(),
});

export const freitextLlmStepContentSchema = z.object({
  sceneBackgroundAsset: optionalSceneBackgroundAssetSchema,
  prompt: z.string().min(1),
  referenceDocument: referenceDocumentSchema.optional(),
  instruction: z.string().optional(),
  /** BCP-like tag for pedagogy framing (Italian, German, ...) */
  targetLanguage: z.string().optional(),
  showWordCount: z.boolean().optional(),
  showCharacterCount: z.boolean().optional(),
  minWords: z.number().int().min(0).optional(),
  maxWords: z.number().int().min(1).optional(),
  evaluation: evaluationSchema,
});

export type FreitextLlmStepContentParsed = Omit<z.infer<typeof freitextLlmStepContentSchema>, "evaluation"> & {
  evaluation: z.infer<typeof evaluationSchema> & {
    taskFulfillmentWeight: number;
    evaluationCriteria: string[];
    targetStructures: string[];
  };
};

export function parseFreitextLlmStepContent(raw: unknown):
  | { ok: true; value: FreitextLlmStepContentParsed }
  | { ok: false; issues: string } {
  const parsed = freitextLlmStepContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.flatten().formErrors.join("; ") };
  }

  const v = parsed.data;
  const evaluationCriteria =
    v.evaluation.evaluationCriteria && v.evaluation.evaluationCriteria.length > 0
      ? v.evaluation.evaluationCriteria
      : [
          "Fulfillment of the teacher prompt, instruction, and task requirements",
          "Italian grammar clarity and morphology",
          "Word choice suitability for meaning",
          "Register fit versus the communicated goal",
        ];
  const targetStructures = v.evaluation.targetStructures ?? [];

  return {
    ok: true,
    value: {
      ...v,
      evaluation: {
        ...v.evaluation,
        taskFulfillmentWeight: v.evaluation.taskFulfillmentWeight ?? 1,
        evaluationCriteria,
        targetStructures,
      },
    },
  };
}

export function countWordsAnswer(text: string): number {
  const t = text.trim();
  if (t === "") return 0;
  return t.split(/\s+/u).filter((w) => w.length > 0).length;
}
