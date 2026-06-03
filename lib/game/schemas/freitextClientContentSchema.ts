import { z } from "zod";
import { optionalSceneBackgroundAssetSchema } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

/** Learner-visible freetext fields only (`evaluation` is server-only and stripped in snapshots). */
export const freitextClientContentSchema = z.object({
  sceneBackgroundAsset: optionalSceneBackgroundAssetSchema,
  prompt: z.string().min(1),
  referenceDocument: referenceDocumentSchema.optional(),
  instruction: z.string().optional(),
  targetLanguage: z.string().optional(),
  showWordCount: z.boolean().optional(),
  showCharacterCount: z.boolean().optional(),
  minWords: z.number().int().min(0).optional(),
  maxWords: z.number().int().min(1).optional(),
});

export type FreitextClientTaskContent = z.infer<typeof freitextClientContentSchema>;

export function parseFreitextClientContent(raw: unknown):
  | { ok: true; value: FreitextClientTaskContent }
  | { ok: false; issues: string } {
  const parsed = freitextClientContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid freetext client payload" };
  }
  return { ok: true, value: parsed.data };
}
