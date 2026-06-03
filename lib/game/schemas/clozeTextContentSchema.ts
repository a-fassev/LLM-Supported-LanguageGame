import { z } from "zod";
import { taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

const LITERAL_KINDS = new Set(["text", "literal"]);

function normalizeSegmentKind(kind: string): string {
  return kind.trim().toLowerCase();
}

const clozeLiteralSegmentSchema = z
  .object({
    kind: z.string().min(1),
    text: z.string().optional(),
  })
  .strict()
  .transform((segment, ctx) => {
    const kind = normalizeSegmentKind(segment.kind);
    if (!LITERAL_KINDS.has(kind)) {
      ctx.addIssue({
        code: "custom",
        message: "expected text or literal segment",
        path: ["kind"],
      });
      return z.NEVER;
    }
    const text = segment.text ?? "";
    if (!text) {
      ctx.addIssue({
        code: "custom",
        message: "literal segment requires text",
        path: ["text"],
      });
      return z.NEVER;
    }
    return { kind: "text" as const, text };
  });

const clozeGapSegmentServerSchema = z
  .object({
    kind: z.literal("gap"),
    placeholder: z.string().optional(),
    maxLength: z.number().int().positive().max(256).optional(),
    ignoreCase: z.union([z.string(), z.boolean()]).optional(),
    correctAnswers: z.array(z.string()).min(1),
  })
  .strict()
  .superRefine((segment, ctx) => {
    const hasAnswer = segment.correctAnswers.some((answer) => answer.trim().length > 0);
    if (!hasAnswer) {
      ctx.addIssue({
        code: "custom",
        message: "gap requires at least one non-empty correctAnswers entry",
        path: ["correctAnswers"],
      });
    }
  });

const clozeGapSegmentClientSchema = z
  .object({
    kind: z.literal("gap"),
    placeholder: z.string().optional(),
    maxLength: z.number().int().positive().max(256).optional(),
    ignoreCase: z.union([z.string(), z.boolean()]).optional(),
  })
  .strict();

const clozeSegmentServerSchema = z.union([clozeLiteralSegmentSchema, clozeGapSegmentServerSchema]);

const clozeSegmentClientSchema = z.union([clozeLiteralSegmentSchema, clozeGapSegmentClientSchema]);

const clozeLineSchema = z.object({
  segments: z.array(clozeSegmentServerSchema).min(1),
});

const clozeLineClientSchema = z.object({
  segments: z.array(clozeSegmentClientSchema).min(1),
});

function refineClozeLines(
  lines: { segments: { kind: string; text?: string }[] }[],
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
): void {
  let gapCount = 0;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    let lineHasContent = false;
    for (const segment of line.segments) {
      if (segment.kind === "gap") {
        gapCount += 1;
        lineHasContent = true;
      } else if (segment.kind === "text" && (segment.text?.trim().length ?? 0) > 0) {
        lineHasContent = true;
      }
    }
    if (!lineHasContent) {
      ctx.addIssue({
        code: "custom",
        message: "each line must include at least one non-empty text or gap segment",
        path: [...pathPrefix, lineIndex, "segments"],
      });
    }
  }
  if (gapCount === 0) {
    ctx.addIssue({
      code: "custom",
      message: "cloze task requires at least one gap",
      path: [...pathPrefix],
    });
  }
}

export const clozeTextContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().min(1),
    referenceDocument: referenceDocumentSchema.optional(),
    caseSensitive: z.boolean().optional(),
    optional: z.boolean().optional(),
    lines: z.array(clozeLineSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    refineClozeLines(value.lines, ctx, ["lines"]);
  });

export const clozeTextClientContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().min(1),
    referenceDocument: referenceDocumentSchema.optional(),
    caseSensitive: z.boolean().optional(),
    optional: z.boolean().optional(),
    lines: z.array(clozeLineClientSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    refineClozeLines(value.lines, ctx, ["lines"]);
  });

export type ClozeTextContentParsed = z.infer<typeof clozeTextContentSchema>;
export type ClozeTextClientContentParsed = z.infer<typeof clozeTextClientContentSchema>;

function formatZodIssues(parsed: z.ZodSafeParseError<unknown>): string {
  return (
    parsed.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ") ||
    "invalid cloze text payload"
  );
}

export function parseClozeTextContent(raw: unknown):
  | { ok: true; value: ClozeTextContentParsed }
  | { ok: false; issues: string } {
  const parsed = clozeTextContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: formatZodIssues(parsed) };
  }
  return { ok: true, value: parsed.data };
}

export function parseClozeClientContent(raw: unknown):
  | { ok: true; value: ClozeTextClientContentParsed }
  | { ok: false; issues: string } {
  const parsed = clozeTextClientContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: formatZodIssues(parsed) };
  }
  return { ok: true, value: parsed.data };
}
