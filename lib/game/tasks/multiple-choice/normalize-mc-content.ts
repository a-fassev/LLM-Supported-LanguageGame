import {
  isMcMultiSelect,
  parseMultipleChoiceContent,
  type MultipleChoiceTaskContent,
} from "@/lib/game/schemas/multipleChoiceContentSchema";
import type { McOptionView, NormalizedMcContent, NormalizedMcQuestion } from "@/lib/game/tasks/multiple-choice/mc-types";

export const MC_CONTENT_MISMATCH_MESSAGE =
  "Contenuto dell'attività non valido. Ricarica la pagina o riprova più tardi.";

export type NormalizeMcResult =
  | { ok: true; content: NormalizedMcContent }
  | { ok: false; message: string };

function mapOption(opt: { id: string; label?: string }): McOptionView {
  const label = opt.label?.trim();
  if (!label) {
    throw new Error(`option '${opt.id}' missing label`);
  }
  return { id: opt.id, label };
}

function mapQuestion(
  raw: {
    id?: string;
    selectionMode?: string;
    preserveOptionOrder?: boolean;
    prompt?: string;
    options: { id: string; label?: string }[];
  },
  fallbackId: string,
): NormalizedMcQuestion {
  return {
    id: raw.id?.trim() || fallbackId,
    selectionMode: raw.selectionMode ?? "single",
    preserveOptionOrder: raw.preserveOptionOrder === true,
    prompt: raw.prompt?.trim() || undefined,
    options: raw.options.map(mapOption),
  };
}

function mapParsedToNormalized(parsed: MultipleChoiceTaskContent): NormalizedMcContent {
  const questionsList = parsed.questions;
  if (questionsList && questionsList.length > 0) {
    return {
      questions: questionsList.map((q, index) => mapQuestion(q, q.id?.trim() || `q${index + 1}`)),
    };
  }

  if (!parsed.options || parsed.options.length < 2) {
    throw new Error("flat multiple choice missing options");
  }
  if (!parsed.correctOptionIds || parsed.correctOptionIds.length === 0) {
    throw new Error("flat multiple choice missing correctOptionIds");
  }

  return {
    questions: [
      mapQuestion(
        {
          selectionMode: parsed.selectionMode,
          preserveOptionOrder: parsed.preserveOptionOrder,
          prompt: parsed.prompt,
          options: parsed.options,
        },
        "q1",
      ),
    ],
  };
}

export function normalizeMcContentResult(taskPayload: Record<string, unknown>): NormalizeMcResult {
  const parsed = parseMultipleChoiceContent(taskPayload);
  if (!parsed.ok) {
    return { ok: false, message: parsed.issues };
  }
  try {
    const content = mapParsedToNormalized(parsed.value);
    if (content.questions.length === 0) {
      return { ok: false, message: "multiple choice has no questions" };
    }
    return { ok: true, content };
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid multiple choice content";
    return { ok: false, message };
  }
}

/** Strict normalize — use after catalog-validated content or when mismatch must surface in UI. */
export function normalizeMcContent(taskPayload: Record<string, unknown>): NormalizedMcContent {
  const result = normalizeMcContentResult(taskPayload);
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.content;
}

export function createEmptyMcSelections(questionCount: number): string[][] {
  return Array.from({ length: questionCount }, () => []);
}

export { isMcMultiSelect };
