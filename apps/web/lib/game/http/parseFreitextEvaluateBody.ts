import { z } from "zod";

const evaluateBodySchema = z.object({
  answerText: z.string().optional().default(""),
});

export type ParseFreitextEvaluateBodyResult =
  | { ok: true; answerText: string }
  | { ok: false; message: string; code: string };

/**
 * Parses POST body for Freitext LLM evaluation. Empty body is valid (treated as empty answer).
 * Malformed JSON surfaces as a hard client error (distinct from answer_empty).
 */
export function parseFreitextEvaluateBody(rawText: string): ParseFreitextEvaluateBodyResult {
  const trimmed = rawText.trim();

  if (trimmed.length === 0) {
    return { ok: true, answerText: "" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return { ok: false, message: "Invalid JSON body", code: "INVALID_JSON" };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, message: "JSON body must be an object", code: "INVALID_JSON_SHAPE" };
  }

  const validated = evaluateBodySchema.safeParse(parsed);
  if (!validated.success) {
    return {
      ok: false,
      message: "Invalid evaluate payload",
      code: "INVALID_PAYLOAD",
    };
  }

  return { ok: true, answerText: validated.data.answerText };
}
