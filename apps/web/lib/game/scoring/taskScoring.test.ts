import { describe, expect, it } from "vitest";
import {
  evaluateCloze,
  evaluateDragDrop,
  evaluateErrorSpotting,
  evaluateMatching,
  evaluateSpecialScreen,
  evaluateTaskAttempt,
} from "./evaluateTaskAttempt";
import type { ParsedPizzaRules } from "./pizzaReward";
import { meetsScoredPizzaMinimum, parsePizzaRewardRules, slicesFromRatio } from "./pizzaReward";

describe("pizzaReward", () => {
  it("maps linear scored ratio to integer slices with floor", () => {
    const rules = parsePizzaRewardRules({
      pizza: {
        mode: "scored",
        maxSlices: 5,
        rounding: "floor",
        mapping: { kind: "linear" },
      },
    });
    expect(rules.kind).toBe("scored");
    if (rules.kind !== "scored") throw new Error("expected scored");
    expect(slicesFromRatio(0.5, rules)).toBe(2);
    expect(slicesFromRatio(1, rules)).toBe(5);
    expect(slicesFromRatio(0, rules)).toBe(0);
  });

  it("parses legacy flat pizza", () => {
    const rules = parsePizzaRewardRules({ pizza: { mode: "flat", value: 3 } });
    expect(rules.kind).toBe("flat");
    if (rules.kind !== "flat") throw new Error("expected flat");
    expect(rules.slices).toBe(3);
  });

  it("clamps flat slices in slicesFromRatio to max 5 (matches parse cap)", () => {
    const flat: ParsedPizzaRules = { kind: "flat", slices: 99 };
    expect(slicesFromRatio(1, flat)).toBe(5);
  });

  it("meetsScoredPizzaMinimum respects minRatioToComplete for scored rules only", () => {
    const scored = parsePizzaRewardRules({
      pizza: {
        mode: "scored",
        maxSlices: 5,
        minRatioToComplete: 0.8,
        mapping: { kind: "linear" },
      },
    });
    expect(meetsScoredPizzaMinimum(0.79, scored)).toBe(false);
    expect(meetsScoredPizzaMinimum(0.8, scored)).toBe(true);

    const flat = parsePizzaRewardRules({ pizza: { mode: "flat", value: 1 } });
    expect(meetsScoredPizzaMinimum(0, flat)).toBe(true);
  });
});

describe("evaluateTaskAttempt", () => {
  it("scores cloze partial credit", () => {
    const content = {
      caseSensitive: false,
      lines: [
        {
          segments: [
            { kind: "gap", correctAnswers: ["a"], ignoreCase: "true" },
            { kind: "gap", correctAnswers: ["b"] },
          ],
        },
      ],
    };
    const attempt = { taskType: "ClozeText" as const, clozeText: { answers: ["a", "wrong"] } };
    const r = evaluateCloze(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(0.5);
    expect(r.itemsCorrect).toBe(1);
    expect(r.itemsTotal).toBe(2);
  });

  it("dispatches evaluateTaskAttempt", () => {
    const content = {
      selectionMode: "single",
      correctOptionIds: ["x"],
      options: [{ id: "x", label: "1" }],
    };
    const attempt = {
      taskType: "MultipleChoice" as const,
      multipleChoice: { selections: [["x"]] },
    };
    const r = evaluateTaskAttempt("MultipleChoice", content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(1);
  });

  it("scores dragdrop by target", () => {
    const content = {
      presentation: { targetMode: "blocks" },
      targets: [
        { id: "t1", correctItemIds: ["a"] },
        { id: "t2", correctItemIds: ["b"] },
      ],
    };
    const attempt = {
      taskType: "DragDrop" as const,
      dragDrop: { assignments: { t1: ["a"], t2: ["wrong"] } },
    };
    const r = evaluateDragDrop(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(0.5);
  });

  it("scores matching pairs", () => {
    const content = {
      correctPairs: [
        { leftItemId: "L1", rightItemId: "R1" },
        { leftItemId: "L2", rightItemId: "R2" },
      ],
    };
    const attempt = {
      taskType: "Matching" as const,
      matching: { pairs: { L1: "R1", L2: "wrong" } },
    };
    const r = evaluateMatching(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(0.5);
  });

  it("special screen with only stub blocks completes with full ratio but zero pizzaRatio", () => {
    const content = {
      blocks: [{ blockType: "stub" }, { blockType: "Stub" }],
    };
    const attempt = {
      taskType: "SpecialScreen" as const,
      specialScreen: {
        blocks: [{ taskType: "Stub" as const }, { taskType: "Stub" as const }],
      },
    };
    const r = evaluateSpecialScreen(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(1);
    expect(r.pizzaRatio).toBe(0);
  });

  it("rejects unsupported special screen block types instead of silently skipping", () => {
    const content = {
      blocks: [{ blockType: "photo_gallery" }],
    };
    const attempt = {
      taskType: "SpecialScreen" as const,
      specialScreen: {
        blocks: [{ taskType: "Stub" as const }],
      },
    };
    const r = evaluateSpecialScreen(content, attempt);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected fail");
    expect(r.code).toBe("unsupported_special_screen_block");
    expect(r.status).toBe(502);
  });

  it("rejects cloze block missing nested payload in content", () => {
    const content = {
      blocks: [{ blockType: "cloze_text" }],
    };
    const attempt = {
      taskType: "SpecialScreen" as const,
      specialScreen: {
        blocks: [{ taskType: "ClozeText" as const, clozeText: { answers: ["a"] } }],
      },
    };
    const r = evaluateSpecialScreen(content, attempt);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected fail");
    expect(r.code).toBe("payload_invalid");
  });

  it("zeroes error spotting on false positive selection", () => {
    const content = {
      segments: [
        { id: "e1", isError: true, acceptedCorrections: ["fix"] },
      ],
    };
    const attempt = {
      taskType: "ErrorSpotting" as const,
      errorSpotting: { selectedSegmentIds: ["e1", "noise"], corrections: { e1: "fix" } },
    };
    const r = evaluateErrorSpotting(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(0);
  });
});
