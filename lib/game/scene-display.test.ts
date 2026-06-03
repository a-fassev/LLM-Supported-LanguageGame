import { describe, expect, it } from "vitest";
import type { RunSceneDto } from "@/lib/api-client";
import { readTaskSceneTitle } from "@/lib/game/scene-display";

function taskScene(content: Record<string, unknown>): RunSceneDto {
  return {
    id: "scene-1",
    sceneNumber: 1,
    scene_type: "task",
    screen_type: "multiple_choice",
    background: "bg",
    content,
    scoring: {},
  };
}

describe("readTaskSceneTitle", () => {
  it("reads content.title", () => {
    const scene = taskScene({ title: "Scegli la risposta" });
    expect(readTaskSceneTitle(scene)).toBe("Scegli la risposta");
  });

  it("falls back to content.task.title", () => {
    const scene = taskScene({ task: { title: "Il biglietto" } });
    expect(readTaskSceneTitle(scene)).toBe("Il biglietto");
  });

  it("returns null when missing", () => {
    const scene = taskScene({ instruction: "Leggi bene." });
    expect(readTaskSceneTitle(scene)).toBeNull();
  });
});
