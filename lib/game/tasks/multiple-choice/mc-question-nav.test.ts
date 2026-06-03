import { describe, expect, it } from "vitest";
import type { RunSceneDto } from "@/lib/api-client";
import { clampMcQuestionIndex, getMcQuestionNavState } from "@/lib/game/tasks/multiple-choice/mc-question-nav";

function mcScene(task: Record<string, unknown>): RunSceneDto {
  return {
    id: "scene-mc",
    sceneNumber: 1,
    scene_type: "task",
    screen_type: "multiple_choice",
    background: "bg",
    content: { task },
    scoring: {},
  };
}

describe("mc-question-nav", () => {
  it("clamps out-of-range question index", () => {
    const scene = mcScene({
      questions: [
        {
          id: "q1",
          selectionMode: "single",
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ],
          correctOptionIds: ["a"],
        },
        {
          id: "q2",
          selectionMode: "single",
          options: [
            { id: "c", label: "C" },
            { id: "d", label: "D" },
          ],
          correctOptionIds: ["c"],
        },
      ],
    });
    expect(clampMcQuestionIndex(scene, 99)).toBe(1);
    expect(getMcQuestionNavState(scene, 99)?.safeIndex).toBe(1);
  });
});
