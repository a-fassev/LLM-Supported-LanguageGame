import { z } from "zod";
import { taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";
import { validateErrorSpottingSegmentText } from "@/lib/game/tasks/error-spotting/validate-error-spotting-segment-text";

const expectedErrorRangeSchema = z
  .object({
    min: z.number().int().min(1),
    max: z.number().int().min(1),
  })
  .strict();

const errorSpottingSegmentSchema = z
  .object({
    id: z.string().min(1),
    text: z.string(),
    isError: z.boolean().optional(),
    acceptedCorrections: z.array(z.string()).optional(),
    hint: z.string().optional(),
  })
  .strict();

const errorSpottingClientSegmentSchema = z
  .object({
    id: z.string().min(1),
    text: z.string(),
    hint: z.string().optional(),
  })
  .strict();

function refineErrorSpottingSegments(
  segments: z.infer<typeof errorSpottingSegmentSchema>[],
  ctx: z.RefinementCtx,
  options: { requireAcceptedCorrections: boolean },
): number {
  const seenIds = new Set<string>();
  let errorCount = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const id = segment.id.trim();
    if (!id) {
      ctx.addIssue({
        code: "custom",
        message: "segment id required",
        path: ["segments", i, "id"],
      });
      continue;
    }
    if (seenIds.has(id)) {
      ctx.addIssue({
        code: "custom",
        message: "duplicate segment id",
        path: ["segments", i, "id"],
      });
    }
    seenIds.add(id);

    const spacing = validateErrorSpottingSegmentText(segment.text, i);
    if (!spacing.ok) {
      ctx.addIssue({
        code: "custom",
        message: spacing.message,
        path: ["segments", i, "text"],
      });
    }

    if (segment.text.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "segment text required",
        path: ["segments", i, "text"],
      });
    }

    const isError = segment.isError === true;
    const corrections = (segment.acceptedCorrections ?? []).map((value) => value.trim()).filter(Boolean);

    if (isError) {
      errorCount++;
      if (options.requireAcceptedCorrections && corrections.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "error segment requires acceptedCorrections",
          path: ["segments", i, "acceptedCorrections"],
        });
      }
    } else if (corrections.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "non-error segment must not include acceptedCorrections",
        path: ["segments", i, "acceptedCorrections"],
      });
    }
  }

  return errorCount;
}

function refineExpectedErrorRange(
  expectedErrorRange: z.infer<typeof expectedErrorRangeSchema> | undefined,
  errorCount: number,
  ctx: z.RefinementCtx,
): void {
  if (!expectedErrorRange) return;

  if (expectedErrorRange.max < expectedErrorRange.min) {
    ctx.addIssue({
      code: "custom",
      message: "expectedErrorRange.max must be >= min",
      path: ["expectedErrorRange", "max"],
    });
    return;
  }

  if (errorCount < expectedErrorRange.min || errorCount > expectedErrorRange.max) {
    ctx.addIssue({
      code: "custom",
      message: `error count ${errorCount} outside expectedErrorRange ${expectedErrorRange.min}-${expectedErrorRange.max}`,
      path: ["expectedErrorRange"],
    });
  }
}

export const errorSpottingContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    instruction: z.string().optional(),
    counterCaption: z.string().optional(),
    expectedErrorRange: expectedErrorRangeSchema.optional(),
    segments: z.array(errorSpottingSegmentSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    const errorCount = refineErrorSpottingSegments(value.segments, ctx, {
      requireAcceptedCorrections: true,
    });
    if (errorCount === 0) {
      ctx.addIssue({
        code: "custom",
        message: "at least one error segment required",
        path: ["segments"],
      });
    }
    refineExpectedErrorRange(value.expectedErrorRange, errorCount, ctx);
  });

/** Player-facing snapshot payload (answer keys stripped in sceneToDto). */
export const errorSpottingClientContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    counterCaption: z.string().optional(),
    expectedErrorRange: expectedErrorRangeSchema.optional(),
    segments: z.array(errorSpottingClientSegmentSchema).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seenIds = new Set<string>();
    for (let i = 0; i < value.segments.length; i++) {
      const segment = value.segments[i];
      const id = segment.id.trim();
      if (seenIds.has(id)) {
        ctx.addIssue({
          code: "custom",
          message: "duplicate segment id",
          path: ["segments", i, "id"],
        });
      }
      seenIds.add(id);
      const spacing = validateErrorSpottingSegmentText(segment.text, i);
      if (!spacing.ok) {
        ctx.addIssue({
          code: "custom",
          message: spacing.message,
          path: ["segments", i, "text"],
        });
      }
      if (segment.text.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "segment text required",
          path: ["segments", i, "text"],
        });
      }
    }
    if (value.expectedErrorRange && value.expectedErrorRange.max < value.expectedErrorRange.min) {
      ctx.addIssue({
        code: "custom",
        message: "expectedErrorRange.max must be >= min",
        path: ["expectedErrorRange", "max"],
      });
    }
  });

export type ErrorSpottingTaskContent = z.infer<typeof errorSpottingContentSchema>;
export type ErrorSpottingClientTaskContent = z.infer<typeof errorSpottingClientContentSchema>;

export function parseErrorSpottingContent(raw: unknown):
  | { ok: true; value: ErrorSpottingTaskContent }
  | { ok: false; issues: string } {
  const parsed = errorSpottingContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid error spotting payload" };
  }
  return { ok: true, value: parsed.data };
}

export function parseErrorSpottingClientContent(raw: unknown):
  | { ok: true; value: ErrorSpottingClientTaskContent }
  | { ok: false; issues: string } {
  const parsed = errorSpottingClientContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid error spotting client payload" };
  }
  return { ok: true, value: parsed.data };
}

