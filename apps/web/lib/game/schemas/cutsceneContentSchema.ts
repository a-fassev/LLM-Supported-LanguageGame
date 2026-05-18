import { z } from "zod";

/**
 * Cutscene `content_payload` / Unity `contentJson` for `step_kind = 'cutscene'`.
 * Strict: unknown keys are rejected (matches authoring discipline in docs).
 */
export const cutsceneContentSchema = z
  .object({
    /** Only version `1` is defined; omit to default authoring to v1 semantics. */
    schemaVersion: z.literal(1).optional(),
    title: z.string().min(1),
    body: z.string().min(1),
    subtitle: z.string().optional(),
    illustrationId: z.string().optional(),
    tone: z.string().optional(),
    ariaNote: z.string().optional(),
    primaryCtaLabel: z.string().optional(),
  })
  .strict();

export type CutsceneContentParsed = z.infer<typeof cutsceneContentSchema>;

export function parseCutsceneContent(raw: unknown):
  | { ok: true; value: CutsceneContentParsed }
  | { ok: false; issues: string } {
  const parsed = cutsceneContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid cutscene payload" };
  }
  return { ok: true, value: parsed.data };
}
