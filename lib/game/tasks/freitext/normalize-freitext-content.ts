import { parseFreitextClientContent } from "@/lib/game/schemas/freitextClientContentSchema";
import { sanitizeTaskPayloadForClient } from "@/lib/game/content/sanitize-task-payload-for-client";
import { mergeFreitextSceneContent } from "@/lib/game/tasks/freitext/merge-freitext-scene-content";
import { FREITEXT_CONTENT_MISMATCH_MESSAGE } from "@/lib/game/tasks/freitext/freitext-messages";

export { FREITEXT_CONTENT_MISMATCH_MESSAGE };

export type NormalizedFreitextContent = {
  prompt: string;
  minWords: number;
  maxWords: number;
  showWordCount: boolean;
  showCharacterCount: boolean;
};

export type NormalizeFreitextResult =
  | { ok: true; content: NormalizedFreitextContent }
  | { ok: false; message: string };

export function normalizeFreitextContentResult(
  taskPayload: Record<string, unknown>,
  sceneInstruction?: string | null,
  shellReferenceDocument?: unknown,
): NormalizeFreitextResult {
  const merged = mergeFreitextSceneContent(taskPayload, sceneInstruction, shellReferenceDocument);
  const sanitized = sanitizeTaskPayloadForClient("free_text", merged) as Record<string, unknown>;
  const parsed = parseFreitextClientContent(sanitized);
  if (!parsed.ok) {
    return { ok: false, message: parsed.issues };
  }

  const value = parsed.value;
  return {
    ok: true,
    content: {
      prompt: value.prompt.trim(),
      minWords: value.minWords ?? 0,
      maxWords: value.maxWords ?? 0,
      showWordCount: value.showWordCount === true,
      showCharacterCount: value.showCharacterCount === true,
    },
  };
}
