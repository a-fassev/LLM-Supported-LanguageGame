import { z } from "zod";
import { optionalAssetIdSchema, taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

const mcOptionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().optional(),
    assetId: optionalAssetIdSchema,
    imageUrl: z.string().url().optional(),
  })
  .passthrough();

const stemBlockSchema = z
  .object({
    kind: z.string().min(1),
    text: z.string().optional(),
    assetId: optionalAssetIdSchema,
    imageUrl: z.string().url().optional(),
    audioAssetId: optionalAssetIdSchema,
    audioUrl: z.string().url().optional(),
  })
  .passthrough();

export const multipleChoiceContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    selectionMode: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    preserveOptionOrder: z.boolean().optional(),
    stem: z.array(stemBlockSchema).optional(),
    options: z.array(mcOptionSchema).optional(),
    correctOptionIds: z.array(z.string()).optional(),
    questions: z
      .array(
        z
          .object({
            id: z.string().optional(),
            selectionMode: z.string().optional(),
            preserveOptionOrder: z.boolean().optional(),
            stem: z.array(stemBlockSchema).optional(),
            options: z.array(mcOptionSchema).min(1),
            correctOptionIds: z.array(z.string()).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export function parseMultipleChoiceContent(raw: unknown):
  | { ok: true; value: z.infer<typeof multipleChoiceContentSchema> }
  | { ok: false; issues: string } {
  const parsed = multipleChoiceContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid multiple choice payload" };
  }
  return { ok: true, value: parsed.data };
}
