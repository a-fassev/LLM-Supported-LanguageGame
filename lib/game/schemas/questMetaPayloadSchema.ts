import { z } from "zod";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";
export const questReferenceDocumentSchema = referenceDocumentSchema;

export const questFlowMetaSchema = z
  .object({
    blockBack: z.boolean().optional(),
    autoStartQuestSlug: z.string().optional(),
  })
  .strict();

export const questMetaPayloadSchema = z
  .object({
    referenceDocument: questReferenceDocumentSchema.optional(),
    flow: questFlowMetaSchema.optional(),
  })
  .strict();

export type QuestMetaPayloadParsed = z.infer<typeof questMetaPayloadSchema>;

/** Lenient read for bootstrap: invalid keys are stripped; logs when parsing fails. */
export function parseQuestMetaPayload(raw: unknown): QuestMetaPayloadParsed {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const parsed = questMetaPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    console.warn("[quest-meta] Invalid meta_payload stripped to empty object:", issues);
    return {};
  }
  return parsed.data;
}

/** Strict validation for write/admin paths. */
export function parseQuestMetaPayloadStrict(raw: unknown):
  | { ok: true; value: QuestMetaPayloadParsed }
  | { ok: false; issues: string } {
  const parsed = questMetaPayloadSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid quest meta payload" };
  }
  return { ok: true, value: parsed.data };
}

export function serializeQuestMetaJson(meta: QuestMetaPayloadParsed): string {
  return JSON.stringify(meta ?? {});
}
