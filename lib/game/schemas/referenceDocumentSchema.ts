import { z } from "zod";

export const referenceDocumentFigureSchema = z
  .object({
    image: z.string().min(1),
    caption: z.string().min(1),
    alt: z.string().optional(),
  })
  .strict();

export const referenceDocumentSectionSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().min(1),
    bodyText: z.string().min(1).optional(),
  })
  .strict()
  .transform((section) => {
    const bodyText = (section.bodyText ?? section.body).trim();
    return { title: section.title, body: bodyText };
  });

function hasNonEmptyText(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export const referenceDocumentSchema = z
  .object({
    documentId: z.string().optional(),
    title: z.string().min(1),
    bodyText: z.string().optional(),
    body: z.string().optional(),
    buttonLabel: z.string().optional(),
    figures: z.array(referenceDocumentFigureSchema).min(1).optional(),
    sections: z.array(referenceDocumentSectionSchema).min(1).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasBody = hasNonEmptyText(value.bodyText) || hasNonEmptyText(value.body);
    const hasSections = (value.sections?.length ?? 0) > 0;
    const hasFigures = (value.figures?.length ?? 0) > 0;
    if (!hasBody && !hasSections && !hasFigures) {
      ctx.addIssue({
        code: "custom",
        message: "referenceDocument requires body, sections, or figures",
        path: ["body"],
      });
    }
  });

export type ReferenceDocumentParsed = z.infer<typeof referenceDocumentSchema>;

export function parseReferenceDocument(raw: unknown):
  | { ok: true; value: ReferenceDocumentParsed }
  | { ok: false; issues: string } {
  const parsed = referenceDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    return { ok: false, issues: issues || "invalid referenceDocument" };
  }
  return { ok: true, value: parsed.data };
}
