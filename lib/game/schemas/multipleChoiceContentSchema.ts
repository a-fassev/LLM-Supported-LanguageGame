import { z } from "zod";
import { optionalAssetIdSchema, taskContentCommonFields } from "@/lib/game/schemas/gameArtAssetSchema";
import { referenceDocumentSchema } from "@/lib/game/schemas/referenceDocumentSchema";

const mcOptionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().optional(),
    text: z.string().optional(),
    assetId: optionalAssetIdSchema,
    imageUrl: z.string().url().optional(),
  })
  .strict()
  .transform((option) => {
    const label = option.label?.trim() || option.text?.trim();
    if (!label) return option;
    const { text, ...rest } = option;
    void text;
    return { ...rest, label };
  });

const mcQuestionSchema = z
  .object({
    id: z.string().optional(),
    selectionMode: z.string().optional(),
    preserveOptionOrder: z.boolean().optional(),
    prompt: z.string().optional(),
    options: z.array(mcOptionSchema).min(2),
    correctOptionIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export function isMcMultiSelect(selectionMode: string | undefined): boolean {
  const mode = (selectionMode ?? "single").trim().toLowerCase();
  return mode === "multi" || mode === "multiple";
}

function refineMcQuestion(
  question: {
    options: { id: string; label?: string }[];
    correctOptionIds: string[];
    selectionMode?: string;
  },
  pathPrefix: (string | number)[],
  ctx: z.RefinementCtx,
): void {
  const optionIds = new Set<string>();
  for (let i = 0; i < question.options.length; i++) {
    const opt = question.options[i];
    if (!opt.label?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "option label required",
        path: [...pathPrefix, "options", i, "label"],
      });
    }
    if (optionIds.has(opt.id)) {
      ctx.addIssue({
        code: "custom",
        message: "duplicate option id",
        path: [...pathPrefix, "options", i, "id"],
      });
    }
    optionIds.add(opt.id);
  }

  const correctSet = new Set<string>();
  for (const id of question.correctOptionIds) {
    if (!optionIds.has(id)) {
      ctx.addIssue({
        code: "custom",
        message: "correctOptionIds must reference option ids",
        path: [...pathPrefix, "correctOptionIds"],
      });
      return;
    }
    correctSet.add(id);
  }

  if (isMcMultiSelect(question.selectionMode)) {
    if (correctSet.size < 1) {
      ctx.addIssue({
        code: "custom",
        message: "multi-select requires at least one correctOptionId",
        path: [...pathPrefix, "correctOptionIds"],
      });
    }
    return;
  }

  if (correctSet.size !== 1) {
    ctx.addIssue({
      code: "custom",
      message: "single-select requires exactly one correctOptionId",
      path: [...pathPrefix, "correctOptionIds"],
    });
  }
}

export const multipleChoiceContentSchema = z
  .object({
    ...taskContentCommonFields,
    prompt: z.string().optional(),
    subtitle: z.string().optional(),
    selectionMode: z.string().optional(),
    referenceDocument: referenceDocumentSchema.optional(),
    preserveOptionOrder: z.boolean().optional(),
    options: z.array(mcOptionSchema).min(2).optional(),
    correctOptionIds: z.array(z.string().min(1)).min(1).optional(),
    questions: z.array(mcQuestionSchema).min(1).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const questions = value.questions;
    const hasQuestions = Array.isArray(questions) && questions.length > 0;
    const hasFlat = Array.isArray(value.options) && value.options.length >= 2;

    if (!hasQuestions && !hasFlat) {
      ctx.addIssue({
        code: "custom",
        message: "multiple choice requires options (flat) or questions[]",
        path: ["options"],
      });
      return;
    }

    if (hasQuestions && hasFlat) {
      ctx.addIssue({
        code: "custom",
        message: "use either flat options or questions[], not both",
        path: ["questions"],
      });
      return;
    }

    if (hasQuestions) {
      questions.forEach((q, index) => {
        refineMcQuestion(
          {
            options: q.options,
            correctOptionIds: q.correctOptionIds,
            selectionMode: q.selectionMode,
          },
          ["questions", index],
          ctx,
        );
      });
      return;
    }

    if (!value.correctOptionIds || value.correctOptionIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "correctOptionIds required",
        path: ["correctOptionIds"],
      });
      return;
    }

    refineMcQuestion(
      {
        options: value.options ?? [],
        correctOptionIds: value.correctOptionIds,
        selectionMode: value.selectionMode,
      },
      [],
      ctx,
    );
  });

export type MultipleChoiceTaskContent = z.infer<typeof multipleChoiceContentSchema>;

export function parseMultipleChoiceContent(raw: unknown):
  | { ok: true; value: MultipleChoiceTaskContent }
  | { ok: false; issues: string } {
  const parsed = multipleChoiceContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ");
    return { ok: false, issues: issues || "invalid multiple choice payload" };
  }
  return { ok: true, value: parsed.data };
}
