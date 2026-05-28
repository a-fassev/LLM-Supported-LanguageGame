import { z } from "zod";
import { taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

export const errorSpottingContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    instruction: z.string().optional(),
    counterCaption: z.string().optional(),
    expectedErrorRange: z
      .object({
        min: z.number().int().min(0),
        max: z.number().int().min(0),
      })
      .optional(),
    segments: z.array(z.object({}).passthrough()).min(1),
  })
  .passthrough();

export function parseErrorSpottingContent(raw: unknown):
  | { ok: true; value: z.infer<typeof errorSpottingContentSchema> }
  | { ok: false; issues: string } {
  const parsed = errorSpottingContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid error spotting payload" };
  }
  return { ok: true, value: parsed.data };
}
