import { parseFreitextLlmStepContent } from "@/lib/llm/freitextLlmContentSchema";
import {
  meetsScoredPizzaMinimum,
  type ParsedPizzaRules,
} from "@/lib/game/scoring/pizzaReward";
import { mergeFreitextSceneContent } from "@/lib/game/tasks/freitext/merge-freitext-scene-content";

export function meetsTaskSceneCompletionMinimum(params: {
  ratio: number;
  screenType: string;
  pizzaRules: ParsedPizzaRules;
  taskPayload?: Record<string, unknown>;
  sceneInstruction?: string | null;
}): boolean {
  const { ratio, screenType, pizzaRules, taskPayload, sceneInstruction } = params;

  if (screenType !== "free_text") {
    return meetsScoredPizzaMinimum(ratio, pizzaRules);
  }

  if (pizzaRules.kind === "scored") {
    return meetsScoredPizzaMinimum(ratio, pizzaRules);
  }

  if (!taskPayload) return false;

  const merged = mergeFreitextSceneContent(taskPayload, sceneInstruction);
  const parsed = parseFreitextLlmStepContent(merged);
  if (!parsed.ok) return false;

  return ratio + 1e-9 >= parsed.value.evaluation.passThreshold;
}
