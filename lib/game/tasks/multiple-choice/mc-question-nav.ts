import type { RunSceneDto } from "@/lib/api-client";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { normalizeMcContentResult } from "@/lib/game/tasks/multiple-choice/normalize-mc-content";

export type McQuestionNavState = {
  questionCount: number;
  safeIndex: number;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
};

export function getMcQuestionNavState(
  scene: RunSceneDto,
  mcQuestionIndex: number,
): McQuestionNavState | null {
  if (scene.screen_type !== "multiple_choice") return null;
  const normalized = normalizeMcContentResult(getTaskPayload(scene));
  if (!normalized.ok) return null;
  const questionCount = normalized.content.questions.length;
  if (questionCount <= 1) {
    return { questionCount, safeIndex: 0, isLastQuestion: true, isFirstQuestion: true };
  }
  const safeIndex = Math.min(Math.max(0, mcQuestionIndex), questionCount - 1);
  return {
    questionCount,
    safeIndex,
    isLastQuestion: safeIndex >= questionCount - 1,
    isFirstQuestion: safeIndex <= 0,
  };
}

export function clampMcQuestionIndex(scene: RunSceneDto, mcQuestionIndex: number): number {
  const nav = getMcQuestionNavState(scene, mcQuestionIndex);
  return nav?.safeIndex ?? 0;
}
