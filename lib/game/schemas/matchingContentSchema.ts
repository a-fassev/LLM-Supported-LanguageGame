import { z } from "zod";
import { optionalAssetIdSchema, taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

const matchingItemSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().optional(),
    text: z.string().optional(),
    assetId: optionalAssetIdSchema,
    imageUrl: z.string().url().optional(),
  })
  .strict()
  .transform((item) => {
    const label = item.label?.trim() || item.text?.trim();
    const { text, ...rest } = item;
    void text;
    if (!label) return rest;
    return { ...rest, label };
  });

const matchingPairSchema = z
  .object({
    leftItemId: z.string().min(1),
    rightItemId: z.string().min(1),
  })
  .strict();

const matchingPoolPairSchema = z
  .object({
    id: z.string().min(1),
    leftLabel: z.string().min(1),
    rightLabel: z.string().min(1),
  })
  .strict();

const matchingPresentationSchema = z
  .object({
    leftLabel: z.string().optional(),
    rightLabel: z.string().optional(),
    shuffleRightOrder: z.boolean().optional(),
  })
  .strict();

function refineMatchingItems(
  value: {
    leftItems?: { id: string; label?: string; assetId?: string; imageUrl?: string }[];
    rightItems?: { id: string; label?: string; assetId?: string; imageUrl?: string }[];
  },
  ctx: z.RefinementCtx,
): void {
  const leftItems = value.leftItems ?? [];
  const rightItems = value.rightItems ?? [];

  const leftIds = new Set<string>();
  for (let i = 0; i < leftItems.length; i++) {
    const item = leftItems[i];
    if (!item.label?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "left item label required (web matching is text-only in v1)",
        path: ["leftItems", i, "label"],
      });
    }
    if (leftIds.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        message: "duplicate left item id",
        path: ["leftItems", i, "id"],
      });
    }
    leftIds.add(item.id);
  }

  const rightIds = new Set<string>();
  for (let i = 0; i < rightItems.length; i++) {
    const item = rightItems[i];
    if (!item.label?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "right item label required (web matching is text-only in v1)",
        path: ["rightItems", i, "label"],
      });
    }
    if (rightIds.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        message: "duplicate right item id",
        path: ["rightItems", i, "id"],
      });
    }
    rightIds.add(item.id);
  }
}

function refineConcreteMatching(
  value: {
    leftItems?: { id: string; label?: string; assetId?: string; imageUrl?: string }[];
    rightItems?: { id: string; label?: string; assetId?: string; imageUrl?: string }[];
    correctPairs?: { leftItemId: string; rightItemId: string }[];
  },
  ctx: z.RefinementCtx,
): void {
  const leftItems = value.leftItems ?? [];
  const rightItems = value.rightItems ?? [];
  const correctPairs = value.correctPairs ?? [];

  refineMatchingItems(value, ctx);

  const leftIds = new Set(leftItems.map((item) => item.id));
  const rightIds = new Set(rightItems.map((item) => item.id));
  const usedRightInPairs = new Set<string>();
  const leftPairCounts = new Map<string, number>();

  for (let i = 0; i < correctPairs.length; i++) {
    const pair = correctPairs[i];
    const leftId = pair.leftItemId.trim();
    const rightId = pair.rightItemId.trim();

    if (!leftIds.has(leftId)) {
      ctx.addIssue({
        code: "custom",
        message: `unknown leftItemId in correctPairs: ${leftId}`,
        path: ["correctPairs", i, "leftItemId"],
      });
    }
    if (!rightIds.has(rightId)) {
      ctx.addIssue({
        code: "custom",
        message: `unknown rightItemId in correctPairs: ${rightId}`,
        path: ["correctPairs", i, "rightItemId"],
      });
    }

    leftPairCounts.set(leftId, (leftPairCounts.get(leftId) ?? 0) + 1);
    if (usedRightInPairs.has(rightId)) {
      ctx.addIssue({
        code: "custom",
        message: "each right item may only be used once in correctPairs",
        path: ["correctPairs", i, "rightItemId"],
      });
    }
    usedRightInPairs.add(rightId);
  }

  for (const leftId of leftIds) {
    const count = leftPairCounts.get(leftId) ?? 0;
    if (count !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "each left item must appear exactly once in correctPairs",
        path: ["correctPairs"],
      });
      break;
    }
  }
}

export const matchingContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    leftItems: z.array(matchingItemSchema).min(1).optional(),
    rightItems: z.array(matchingItemSchema).min(1).optional(),
    correctPairs: z.array(matchingPairSchema).min(1).optional(),
    sampleSize: z.number().int().min(1).max(50).optional(),
    poolPairs: z.array(matchingPoolPairSchema).min(1).optional(),
    presentation: matchingPresentationSchema.optional(),
  })
  .strict()
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
        code: "custom",
        message:
          "Matching payload must provide either concrete leftItems/rightItems/correctPairs or poolPairs+sampleSize",
        path: ["root"],
      });
      return;
    }

    if (hasConcrete) {
      refineConcreteMatching(value, ctx);
    }

    if (hasPoolAuthoring && value.poolPairs) {
      if ((value.sampleSize ?? 0) > value.poolPairs.length) {
        ctx.addIssue({
          code: "custom",
          message: "sampleSize must be <= poolPairs length",
          path: ["sampleSize"],
        });
      }

      const ids = new Set<string>();
      for (const pair of value.poolPairs) {
        if (ids.has(pair.id)) {
          ctx.addIssue({
            code: "custom",
            message: `duplicate pool pair id: ${pair.id}`,
            path: ["poolPairs"],
          });
          break;
        }
        ids.add(pair.id);
      }
    }
  });

/** Player-facing snapshot payload (answer keys stripped in sceneToDto). */
export const matchingClientContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    leftItems: z.array(matchingItemSchema).min(1),
    rightItems: z.array(matchingItemSchema).min(1),
    presentation: matchingPresentationSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    refineMatchingItems(value, ctx);
  });

export type MatchingTaskContent = z.infer<typeof matchingContentSchema>;
export type MatchingClientTaskContent = z.infer<typeof matchingClientContentSchema>;

export function parseMatchingContent(raw: unknown):
  | { ok: true; value: MatchingTaskContent }
  | { ok: false; issues: string } {
  const parsed = matchingContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid matching payload" };
  }
  return { ok: true, value: parsed.data };
}

export function parseMatchingClientContent(raw: unknown):
  | { ok: true; value: MatchingClientTaskContent }
  | { ok: false; issues: string } {
  const parsed = matchingClientContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid matching client payload" };
  }
  return { ok: true, value: parsed.data };
}
