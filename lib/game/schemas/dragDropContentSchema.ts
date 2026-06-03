import { z } from "zod";
import { optionalAssetIdSchema, taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

const dragDropItemSchema = z
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

/** "one" = zone scored when exactly one listed item is placed (OR in correctItemIds); UI may hold multiple tiles while editing. "all" = bucket: every listed item in one zone. */
export const dragDropTargetSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().optional(),
    matchMode: z.enum(["one", "all"]).optional(),
    correctItemIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

const dragDropPresentationSchema = z
  .object({
    targetMode: z.enum(["blocks", "lines"]).optional(),
    sourceLabel: z.string().optional(),
    targetLabel: z.string().optional(),
  })
  .strict();

const dragDropLineSegmentSchema = z
  .object({
    kind: z.string().min(1),
    text: z.string().optional(),
    targetId: z.string().optional(),
  })
  .strict();

const dragDropLineSchema = z
  .object({
    segments: z.array(dragDropLineSegmentSchema).min(1),
  })
  .strict();

function refineDragDropItems(
  items: { id: string; label?: string }[],
  ctx: z.RefinementCtx,
  pathPrefix: string,
): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.label?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "item label required (web drag_drop is text-only in v1)",
        path: [pathPrefix, i, "label"],
      });
    }
    if (ids.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        message: "duplicate item id",
        path: [pathPrefix, i, "id"],
      });
    }
    ids.add(item.id);
  }
  return ids;
}

function refineDragDropBlocks(
  value: {
    items: { id: string; label?: string }[];
    targets: { id: string; correctItemIds: string[] }[];
  },
  ctx: z.RefinementCtx,
): void {
  const itemIds = refineDragDropItems(value.items, ctx, "items");
  const targetIds = new Set<string>();

  for (let i = 0; i < value.targets.length; i++) {
    const target = value.targets[i];
    if (targetIds.has(target.id)) {
      ctx.addIssue({
        code: "custom",
        message: "duplicate target id",
        path: ["targets", i, "id"],
      });
    }
    targetIds.add(target.id);

    for (let j = 0; j < target.correctItemIds.length; j++) {
      const itemId = target.correctItemIds[j].trim();
      if (!itemIds.has(itemId)) {
        ctx.addIssue({
          code: "custom",
          message: `unknown item id in correctItemIds: ${itemId}`,
          path: ["targets", i, "correctItemIds", j],
        });
      }
    }
  }
}

const dragDropBlocksBaseSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    items: z.array(dragDropItemSchema).min(1),
    targets: z.array(dragDropTargetSchema).min(1),
    presentation: dragDropPresentationSchema.optional(),
    shuffleItemOrder: z.boolean().optional(),
    /** Legacy flag; web does not block Controlla on bank items (scoring only). */
    requireBankEmpty: z.boolean().optional(),
  })
  .strict();

export const dragDropContentSchema = dragDropBlocksBaseSchema.superRefine((value, ctx) => {
  const mode = value.presentation?.targetMode ?? "blocks";
  if (mode === "lines") {
    ctx.addIssue({
      code: "custom",
      message: 'presentation.targetMode "lines" is not supported in the web catalog yet',
      path: ["presentation", "targetMode"],
    });
    return;
  }
  refineDragDropBlocks(value, ctx);
});

/** Player-facing snapshot payload (answer keys stripped before client). */
export const dragDropClientContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    items: z.array(dragDropItemSchema).min(1),
    targets: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().optional(),
            matchMode: z.enum(["one", "all"]).optional(),
          })
          .strict(),
      )
      .min(1),
    presentation: dragDropPresentationSchema.optional(),
    shuffleItemOrder: z.boolean().optional(),
    /** Legacy flag; web does not block Controlla on bank items (scoring only). */
    requireBankEmpty: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const mode = value.presentation?.targetMode ?? "blocks";
    if (mode === "lines") {
      ctx.addIssue({
        code: "custom",
        message: 'presentation.targetMode "lines" is not supported on web yet',
        path: ["presentation", "targetMode"],
      });
      return;
    }
    refineDragDropItems(value.items, ctx, "items");
    const targetIds = new Set<string>();
    for (let i = 0; i < value.targets.length; i++) {
      if (targetIds.has(value.targets[i].id)) {
        ctx.addIssue({
          code: "custom",
          message: "duplicate target id",
          path: ["targets", i, "id"],
        });
      }
      targetIds.add(value.targets[i].id);
    }
  });

/** Full authoring schema including lines (for stepContentValidation / legacy payloads). */
export const dragDropAuthoringContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    items: z.array(dragDropItemSchema).min(1),
    targets: z.array(dragDropTargetSchema).optional(),
    presentation: z.object({ targetMode: z.string().optional() }).passthrough().optional(),
    lines: z.array(dragDropLineSchema).optional(),
    shuffleItemOrder: z.boolean().optional(),
    /** Legacy flag; web does not block Controlla on bank items (scoring only). */
    requireBankEmpty: z.boolean().optional(),
  })
  .passthrough();

export type DragDropTaskContent = z.infer<typeof dragDropContentSchema>;
export type DragDropClientTaskContent = z.infer<typeof dragDropClientContentSchema>;

export function parseDragDropContent(raw: unknown):
  | { ok: true; value: DragDropTaskContent }
  | { ok: false; issues: string } {
  const parsed = dragDropContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid drag drop payload" };
  }
  return { ok: true, value: parsed.data };
}

export function parseDragDropClientContent(raw: unknown):
  | { ok: true; value: DragDropClientTaskContent }
  | { ok: false; issues: string } {
  const parsed = dragDropClientContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid drag drop client payload" };
  }
  return { ok: true, value: parsed.data };
}

/** Legacy loose parse for step payloads (Unity-era shapes). */
export function parseDragDropAuthoringContent(raw: unknown):
  | { ok: true; value: z.infer<typeof dragDropAuthoringContentSchema> }
  | { ok: false; issues: string } {
  const parsed = dragDropAuthoringContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid drag drop payload" };
  }
  return { ok: true, value: parsed.data };
}
