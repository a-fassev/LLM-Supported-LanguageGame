import { countWordsAnswer } from "@/lib/llm/freitextLlmContentSchema";
import { FREITEXT_ABSOLUTE_MAX_CHARACTERS } from "@/lib/game/tasks/freitext/freitext-messages";
import type { NormalizedFreitextContent } from "@/lib/game/tasks/freitext/normalize-freitext-content";

export function formatFreitextStatsLine(content: NormalizedFreitextContent, answerText: string): string | null {
  const showWord = content.showWordCount;
  const showChar = content.showCharacterCount;
  const minW = content.minWords;
  const maxW = content.maxWords;

  if (!showWord && !showChar && minW <= 0 && maxW <= 0) {
    return null;
  }

  const parts: string[] = [];
  const needsWordHint = showWord || minW > 0 || maxW > 0;
  if (needsWordHint) {
    const wc = countWordsAnswer(answerText);
    let line = `Parole scritte: ${wc}`;
    if (minW > 0 && maxW > 0) {
      line += ` (da ${minW} a ${maxW})`;
    } else if (minW > 0) {
      line += ` (almeno ${minW})`;
    } else if (maxW > 0) {
      line += ` (al massimo ${maxW})`;
    }
    parts.push(line);
  }

  if (showChar) {
    const len = Math.min(answerText.length, FREITEXT_ABSOLUTE_MAX_CHARACTERS);
    parts.push(`Caratteri: ${len} / ${FREITEXT_ABSOLUTE_MAX_CHARACTERS}`);
  }

  return parts.join(" | ");
}
