import { z } from "zod";
import { optionalAssetIdSchema, taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";

const photoItemSchema = z
  .object({
    id: z.string().optional(),
    assetId: optionalAssetIdSchema,
    imageUrl: z.string().url().optional(),
    caption: z.string().optional(),
    requireLearnerCaption: z.boolean().optional(),
    acceptedCaptions: z.array(z.string()).optional(),
  })
  .passthrough();

export const specialScreenContentSchema = z
  .object({
    ...taskContentCommonFields,
    screenVariant: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    smsChrome: z.object({}).passthrough().optional(),
    readerChrome: z
      .object({
        assetId: optionalAssetIdSchema,
        imageUrl: z.string().url().optional(),
      })
      .passthrough()
      .optional(),
    photoViewerChrome: z
      .object({
        displayMode: z.string().optional(),
        showCaptions: z.boolean().optional(),
        items: z.array(photoItemSchema).min(1).optional(),
      })
      .passthrough()
      .optional(),
    mailChrome: z.object({}).passthrough().optional(),
    blocks: z.array(z.object({}).passthrough()).optional(),
  })
  .passthrough();

export function parseSpecialScreenContent(raw: unknown):
  | { ok: true; value: z.infer<typeof specialScreenContentSchema> }
  | { ok: false; issues: string } {
  const parsed = specialScreenContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid special screen payload" };
  }
  return { ok: true, value: parsed.data };
}
