import { describe, expect, it } from "vitest";
import { buildMatchingAttempt } from "@/lib/game/tasks/matching/build-matching-attempt";
import { stableShuffleMatchingItems } from "@/lib/game/tasks/matching/matching-display-order";
import {
  connectorPoint,
  segmentBetweenElements,
  toLocalPoint,
} from "@/lib/game/tasks/matching/matching-line-geometry";
import { applyMatchingPair, clearMatchingPair } from "@/lib/game/tasks/matching/matching-pair-actions";
import { createEmptyMatchingPairs } from "@/lib/game/tasks/matching/normalize-matching-content";
import { validateMatchingDraft } from "@/lib/game/tasks/matching/validate-matching-draft";

describe("matching helpers", () => {
  const leftIds = ["l1", "l2", "l3"] as const;

  it("creates empty draft for all left ids", () => {
    expect(createEmptyMatchingPairs([...leftIds])).toEqual({
      l1: null,
      l2: null,
      l3: null,
    });
  });

  it("steals right item from another left when re-pairing", () => {
    const pairs = { l1: "r1", l2: null, l3: null };
    const next = applyMatchingPair(pairs, "l2", "r1", leftIds);
    expect(next).toEqual({ l1: null, l2: "r1", l3: null });
  });

  it("toggles off when same left-right pair is applied again", () => {
    const pairs = { l1: "r1", l2: null, l3: null };
    const next = applyMatchingPair(pairs, "l1", "r1", leftIds);
    expect(next.l1).toBeNull();
  });

  it("clears a single left pair", () => {
    const pairs = { l1: "r1", l2: "r2", l3: null };
    expect(clearMatchingPair(pairs, "l2")).toEqual({ l1: "r1", l2: null, l3: null });
  });

  it("validates incomplete draft", () => {
    const incomplete = validateMatchingDraft(leftIds, { l1: "r1", l2: null, l3: "r3" });
    expect(incomplete.ok).toBe(false);
    if (incomplete.ok) throw new Error("expected failure");

    const complete = validateMatchingDraft(leftIds, { l1: "r1", l2: "r2", l3: "r3" });
    expect(complete.ok).toBe(true);
  });

  it("builds attempt payload with all left ids", () => {
    const attempt = buildMatchingAttempt(leftIds, { l1: "r1", l2: "r2", l3: "r3" });
    expect(attempt).toEqual({
      taskType: "Matching",
      matching: { pairs: { l1: "r1", l2: "r2", l3: "r3" } },
    });
  });

  it("stable shuffle is deterministic for a seed", () => {
    const items = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
      { id: "d", label: "D" },
    ];
    const first = stableShuffleMatchingItems(items, "scene-06");
    const second = stableShuffleMatchingItems(items, "scene-06");
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
    expect(first.map((item) => item.id).sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("computes connector segment in local coordinates", () => {
    const container = { left: 100, top: 50, width: 400, height: 300 };
    const leftRect = { left: 120, top: 80, width: 120, height: 40 };
    const rightRect = { left: 360, top: 80, width: 120, height: 40 };

    const start = toLocalPoint(connectorPoint(leftRect, "right"), container);
    const end = toLocalPoint(connectorPoint(rightRect, "left"), container);
    const segment = segmentBetweenElements(leftRect, rightRect, container);

    expect(start).toEqual({ x: 140, y: 50 });
    expect(end).toEqual({ x: 260, y: 50 });
    expect(segment).toEqual({ x1: 140, y1: 50, x2: 260, y2: 50 });
  });
});
