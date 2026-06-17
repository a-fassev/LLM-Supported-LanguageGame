import { countFreitextAnswerWordsBeyondTemplate } from "@/lib/game/tasks/freitext/freitext-initial-answer";
import type { NormalizedFreitextContent } from "@/lib/game/tasks/freitext/normalize-freitext-content";

export function formatFreitextStatsLine(content: NormalizedFreitextContent, answerText: string): string | null {
  const showWord = content.showWordCount;
  const showChar = content.showCharacterCount;
  const minW = content.minWords;
  const hasTemplate = content.initialAnswerText !== undefined;

  if (!showWord && !showChar && minW <= 0) {
    return null;
  }

  const parts: string[] = [];
  const needsWordHint = showWord || minW > 0;
  if (needsWordHint) {
    const wc = hasTemplate
      ? countFreitextAnswerWordsBeyondTemplate(answerText, content.initialAnswerText)
      : countFreitextAnswerWordsBeyondTemplate(answerText);
    let line = hasTemplate ? `Parole aggiunte: ${wc}` : `Parole scritte: ${wc}`;
    if (minW > 0) {
      line += ` (almeno ${minW})`;
    }
    parts.push(line);
  }

  if (showChar) {
    parts.push(`Caratteri: ${answerText.length}`);
  }

  return parts.join(" | ");
}
