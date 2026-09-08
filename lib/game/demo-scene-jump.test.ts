import { describe, expect, it } from "vitest";
import { sceneJumpLabel, sceneJumpTargetsForQuest } from "./demo-scene-jump";
import type { CatalogScene } from "@/lib/game/content/catalog-loader";

const story: CatalogScene = {
  id: "s1",
  sceneNumber: 1,
  filename: "01.json",
  scene_type: "story",
  screen_type: "info",
  background: "bg",
  content: { text: "Ciao" },
};

const task: CatalogScene = {
  id: "s2",
  sceneNumber: 2,
  filename: "02.json",
  scene_type: "task",
  screen_type: "cloze",
  background: "bg",
  content: { title: "Congiuntivo" },
};

describe("demo-scene-jump", () => {
  it("labels story vs task scenes", () => {
    expect(sceneJumpLabel(story)).toBe("01 · Storia");
    expect(sceneJumpLabel(task)).toBe("02 · Congiuntivo");
  });

  it("lists catalog scenes in order", () => {
    expect(sceneJumpTargetsForQuest([task, story])).toEqual([
      { id: "s1", label: "01 · Storia" },
      { id: "s2", label: "02 · Congiuntivo" },
    ]);
  });
});
