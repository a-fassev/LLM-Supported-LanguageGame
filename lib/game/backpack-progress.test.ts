import { describe, expect, it } from "vitest";
import {
  countBackpackProgressTasks,
  deriveBackpackProgress,
} from "@/lib/game/backpack-progress";
import { loadContentCatalog } from "@/lib/game/content/catalog-loader";

describe("deriveBackpackProgress", () => {
  it("computes rounded percent from completed tasks over total", () => {
    expect(deriveBackpackProgress(0, 53)).toEqual({
      backpackProgressPercent: 0,
      backpackCompletedTasks: 0,
      backpackTotalTasks: 53,
    });
    expect(deriveBackpackProgress(13, 53)).toEqual({
      backpackProgressPercent: 25,
      backpackCompletedTasks: 13,
      backpackTotalTasks: 53,
    });
    expect(deriveBackpackProgress(53, 53)).toEqual({
      backpackProgressPercent: 100,
      backpackCompletedTasks: 53,
      backpackTotalTasks: 53,
    });
  });

  it("clamps completed tasks and percent", () => {
    expect(deriveBackpackProgress(99, 53).backpackProgressPercent).toBe(100);
    expect(deriveBackpackProgress(99, 53).backpackCompletedTasks).toBe(53);
  });
});

describe("countBackpackProgressTasks", () => {
  it("counts learner task scenes in chapter-01..06 only", async () => {
    const catalog = await loadContentCatalog({ bypassCache: true });
    expect(countBackpackProgressTasks(catalog)).toBe(53);
  });
});
