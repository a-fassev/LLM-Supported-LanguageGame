import { z } from "zod";
import { optionalAssetIdSchema, taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";

const dragDropItemSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().optional(),
    assetId: optionalAssetIdSchema,
    imageUrl: z.string().url().optional(),
  })
  .passthrough();

export const dragDropContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    items: z.array(dragDropItemSchema).min(1),
    targets: z.array(z.object({ id: z.string().min(1) }).passthrough()).optional(),
    presentation: z.object({ targetMode: z.string().optional() }).passthrough().optional(),
    lines: z.array(z.object({}).passthrough()).optional(),
    shuffleItemOrder: z.boolean().optional(),
    requireBankEmpty: z.boolean().optional(),
  })
  .passthrough();

export function parseDragDropContent(raw: unknown):
  | { ok: true; value: z.infer<typeof dragDropContentSchema> }
  | { ok: false; issues: string } {
  const parsed = dragDropContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid drag drop payload" };
  }
  return { ok: true, value: parsed.data };
}
