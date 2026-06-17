import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogScene } from "@/lib/game/content/catalog-loader";

const repoMocks = vi.hoisted(() => ({
  getSceneMaterialization: vi.fn(),
  insertSceneMaterializationIfAbsent: vi.fn(),
}));

vi.mock("@/lib/game/repositories/game-progress-repository", () => repoMocks);

import { resolveCatalogSceneForRun } from "@/lib/game/tasks/matching/resolve-matching-scene-task";

function poolScene(): CatalogScene {
  return {
    id: "chapter-01-quest-01-bonus-scene-02",
    sceneNumber: 2,
    filename: "02.json",
    scene_type: "task",
    screen_type: "matching",
    background: "bg",
    content: {
      title: "Bonus",
      task: {
        prompt: "Match",
        sampleSize: 2,
        poolPairs: [
          { id: "a", leftLabel: "ciao", rightLabel: "hello" },
          { id: "b", leftLabel: "grazie", rightLabel: "thanks" },
          { id: "c", leftLabel: "notte", rightLabel: "night" },
        ],
      },
    },
    scoring: {
      backpack: { pieces: 1 },
      pizza: {
        mode: "scored",
        maxSlices: 3,
        rounding: "floor",
        mapping: { kind: "linear" },
      },
    },
  };
}

describe("resolveCatalogSceneForRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoMocks.getSceneMaterialization.mockResolvedValue({ ok: true, materializedTask: null });
    repoMocks.insertSceneMaterializationIfAbsent.mockResolvedValue(true);
  });

  it("reuses persisted materialization for the same run", async () => {
    const persisted = {
      leftItems: [{ id: "left_a", label: "ciao" }],
      rightItems: [{ id: "right_a", label: "hello" }],
      correctPairs: [{ leftItemId: "left_a", rightItemId: "right_a" }],
    };
    repoMocks.getSceneMaterialization.mockResolvedValue({ ok: true, materializedTask: persisted });

    const resolved = await resolveCatalogSceneForRun("run-1", poolScene());
    expect(resolved?.content.task).toEqual(persisted);
    expect(repoMocks.insertSceneMaterializationIfAbsent).not.toHaveBeenCalled();
  });

  it("materializes pool authoring on first encounter", async () => {
    const resolved = await resolveCatalogSceneForRun("run-1", poolScene());
    const task = resolved?.content.task as {
      leftItems: { id: string }[];
      poolPairs?: unknown;
    };
    expect(task.leftItems).toHaveLength(2);
    expect(task.poolPairs).toBeUndefined();
    expect(repoMocks.insertSceneMaterializationIfAbsent).toHaveBeenCalledOnce();
  });

  it("re-reads persisted row when a concurrent request wins the insert race", async () => {
    const raced = {
      leftItems: [{ id: "left_a", label: "ciao" }],
      rightItems: [{ id: "right_a", label: "hello" }],
      correctPairs: [{ leftItemId: "left_a", rightItemId: "right_a" }],
    };
    repoMocks.insertSceneMaterializationIfAbsent.mockResolvedValue(false);
    repoMocks.getSceneMaterialization
      .mockResolvedValueOnce({ ok: true, materializedTask: null })
      .mockResolvedValueOnce({ ok: true, materializedTask: raced });

    const resolved = await resolveCatalogSceneForRun("run-1", poolScene());
    expect(resolved?.content.task).toEqual(raced);
    expect(repoMocks.insertSceneMaterializationIfAbsent).toHaveBeenCalledOnce();
  });

  it("returns null when materialization read fails", async () => {
    repoMocks.getSceneMaterialization.mockResolvedValue({ ok: false });

    const resolved = await resolveCatalogSceneForRun("run-1", poolScene());
    expect(resolved).toBeNull();
    expect(repoMocks.insertSceneMaterializationIfAbsent).not.toHaveBeenCalled();
  });
});
