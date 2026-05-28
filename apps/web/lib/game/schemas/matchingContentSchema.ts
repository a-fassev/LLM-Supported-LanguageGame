import { z } from "zod";
import { optionalAssetIdSchema, taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

const matchingItemSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().optional(),
    assetId: optionalAssetIdSchema,
    imageUrl: z.string().url().optional(),
  })
  .passthrough();

export const matchingContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    leftItems: z.array(matchingItemSchema).min(1),
    rightItems: z.array(matchingItemSchema).min(1),
    correctPairs: z
      .array(
        z.object({
          leftItemId: z.string().min(1),
          rightItemId: z.string().min(1),
        }),
      )
      .min(1),
    presentation: z
      .object({
        leftLabel: z.string().optional(),
        rightLabel: z.string().optional(),
        shuffleRightOrder: z.boolean().optional(),
      })
      .optional(),
  })
  .passthrough();

export function parseMatchingContent(raw: unknown):
  | { ok: true; value: z.infer<typeof matchingContentSchema> }
  | { ok: false; issues: string } {
  const parsed = matchingContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid matching payload" };
  }
  return { ok: true, value: parsed.data };
}
