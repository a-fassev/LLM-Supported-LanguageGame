import type { McOptionView, NormalizedMcQuestion } from "@/lib/game/tasks/multiple-choice/mc-types";
import { shuffleMcOptions } from "@/lib/game/tasks/multiple-choice/shuffle-options";

export function mcQuestionCacheKey(sceneId: string, question: NormalizedMcQuestion, questionIndex: number): string {
  return `${sceneId}:${question.id ?? `idx-${questionIndex}`}`;
}

export function getStableMcDisplayOptions(
  question: NormalizedMcQuestion,
  cacheKey: string,
  cache: Map<string, McOptionView[]>,
): McOptionView[] {
  if (question.preserveOptionOrder) {
    return question.options;
  }
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const shuffled = shuffleMcOptions(question.options);
  cache.set(cacheKey, shuffled);
  return shuffled;
}
