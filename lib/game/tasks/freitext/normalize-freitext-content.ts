import { parseFreitextClientContent } from "@/lib/game/schemas/freitextClientContentSchema";
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
): NormalizeFreitextResult {
  const merged = mergeFreitextSceneContent(taskPayload, sceneInstruction);
  const parsed = parseFreitextClientContent(merged);
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
