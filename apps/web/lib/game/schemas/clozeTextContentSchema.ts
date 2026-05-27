import { z } from "zod";
import { taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";

const clozeSegmentSchema = z
  .object({
    kind: z.string().min(1),
    text: z.string().optional(),
    placeholder: z.string().optional(),
    maxLength: z.number().int().positive().optional(),
    ignoreCase: z.union([z.string(), z.boolean()]).optional(),
    correctAnswers: z.array(z.string()).optional(),
  })
  .passthrough();

const clozeLineSchema = z.object({
  segments: z.array(clozeSegmentSchema).min(1),
});

export const clozeTextContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().min(1),
    caseSensitive: z.boolean().optional(),
    lines: z.array(clozeLineSchema).min(1),
  })
  .passthrough();

export type ClozeTextContentParsed = z.infer<typeof clozeTextContentSchema>;

export function parseClozeTextContent(raw: unknown):
  | { ok: true; value: ClozeTextContentParsed }
  | { ok: false; issues: string } {
  const parsed = clozeTextContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid cloze text payload" };
  }
  return { ok: true, value: parsed.data };
}
