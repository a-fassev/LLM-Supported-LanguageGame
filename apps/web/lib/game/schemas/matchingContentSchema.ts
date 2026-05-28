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

const matchingPoolPairSchema = z
  .object({
    id: z.string().min(1),
    leftLabel: z.string().min(1),
    rightLabel: z.string().min(1),
  })
  .passthrough();

export const matchingContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    leftItems: z.array(matchingItemSchema).min(1).optional(),
    rightItems: z.array(matchingItemSchema).min(1).optional(),
    correctPairs: z
      .array(
        z.object({
          leftItemId: z.string().min(1),
          rightItemId: z.string().min(1),
        }),
      )
      .min(1)
      .optional(),
    sampleSize: z.number().int().min(1).max(50).optional(),
    poolPairs: z.array(matchingPoolPairSchema).min(1).optional(),
    presentation: z
      .object({
        leftLabel: z.string().optional(),
        rightLabel: z.string().optional(),
        shuffleRightOrder: z.boolean().optional(),
      })
      .optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const hasConcrete =
      Array.isArray(value.leftItems) &&
      value.leftItems.length > 0 &&
      Array.isArray(value.rightItems) &&
      value.rightItems.length > 0 &&
      Array.isArray(value.correctPairs) &&
      value.correctPairs.length > 0;

    const hasPoolAuthoring =
      Array.isArray(value.poolPairs) &&
      value.poolPairs.length > 0 &&
      typeof value.sampleSize === "number";

    if (!hasConcrete && !hasPoolAuthoring) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Matching payload must provide either concrete leftItems/rightItems/correctPairs or poolPairs+sampleSize",
        path: ["root"],
      });
      return;
    }

    if (hasPoolAuthoring && value.poolPairs) {
      if ((value.sampleSize ?? 0) > value.poolPairs.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "sampleSize must be <= poolPairs length",
          path: ["sampleSize"],
        });
      }

      const ids = new Set<string>();
      for (const pair of value.poolPairs) {
        if (ids.has(pair.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `duplicate pool pair id: ${pair.id}`,
            path: ["poolPairs"],
          });
          break;
        }
        ids.add(pair.id);
      }
    }
  });

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
