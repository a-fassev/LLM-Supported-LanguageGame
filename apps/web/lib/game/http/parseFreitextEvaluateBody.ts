import { z } from "zod";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";

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
    return { ok: false, message: routeMsg.invalidJson, code: "INVALID_JSON" };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, message: "Il corpo JSON deve essere un oggetto.", code: "INVALID_JSON_SHAPE" };
  }

  const validated = evaluateBodySchema.safeParse(parsed);
  if (!validated.success) {
    return {
      ok: false,
      message: "Payload di valutazione non valido.",
      code: "INVALID_PAYLOAD",
    };
  }

  return { ok: true, answerText: validated.data.answerText };
}
