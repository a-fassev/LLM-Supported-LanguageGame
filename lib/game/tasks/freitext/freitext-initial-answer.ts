import { countWordsAnswer } from "@/lib/llm/freitextLlmContentSchema";

export function freitextTemplateLines(initialAnswerText: string): string[] {
  return initialAnswerText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function isFreitextAnswerUnchangedTemplate(
  answerText: string,
  initialAnswerText?: string,
): boolean {
  if (initialAnswerText === undefined) return false;
  return answerText.trim() === initialAnswerText.trim();
}

/** Word count excluding the prefilled template labels (minWords applies to learner-added content). */
export function countFreitextAnswerWordsBeyondTemplate(
  answerText: string,
  initialAnswerText?: string,
): number {
  const trimmed = answerText.trim();
  if (initialAnswerText === undefined) {
    return countWordsAnswer(trimmed);
  }
  const initialTrimmed = initialAnswerText.trim();
  if (trimmed === initialTrimmed) return 0;
  return Math.max(0, countWordsAnswer(trimmed) - countWordsAnswer(initialTrimmed));
}

export function isFreitextAnswerMissingTemplateStructure(
  answerText: string,
  initialAnswerText?: string,
): boolean {
  if (initialAnswerText === undefined) return false;
  const trimmed = answerText.trim();
  return freitextTemplateLines(initialAnswerText).some((line) => !trimmed.includes(line));
}
