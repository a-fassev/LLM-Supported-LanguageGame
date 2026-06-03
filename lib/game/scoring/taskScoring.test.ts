import { describe, expect, it } from "vitest";
import {
  evaluateCloze,
  evaluateDragDrop,
  evaluateErrorSpotting,
  evaluateMatching,
  evaluateMultipleChoice,
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

  it("scores multiple choice partial credit and multi-select", () => {
    const content = {
      questions: [
        {
          selectionMode: "single",
          correctOptionIds: ["a"],
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ],
        },
        {
          selectionMode: "multi",
          correctOptionIds: ["x", "y"],
          options: [
            { id: "x", label: "X" },
            { id: "y", label: "Y" },
            { id: "z", label: "Z" },
          ],
        },
      ],
    };
    const partial = evaluateMultipleChoice(content, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: [["a"], ["x"]] },
    });
    expect(partial.ok).toBe(true);
    if (!partial.ok) throw new Error("fail");
    expect(partial.ratio).toBe(0.5);

    const full = evaluateMultipleChoice(content, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: [["a"], ["x", "y"]] },
    });
    expect(full.ok).toBe(true);
    if (!full.ok) throw new Error("fail");
    expect(full.ratio).toBe(1);
  });

  it("returns attempt_mismatch when multiple choice selection count differs", () => {
    const content = {
      questions: [
        { selectionMode: "single", correctOptionIds: ["a"], options: [{ id: "a", label: "A" }] },
        { selectionMode: "single", correctOptionIds: ["b"], options: [{ id: "b", label: "B" }] },
      ],
    };
    const r = evaluateMultipleChoice(content, {
      taskType: "MultipleChoice",
      multipleChoice: { selections: [["a"]] },
    });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected fail");
    expect(r.code).toBe("attempt_mismatch");
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

  it("scores all-empty dragdrop assignments as ratio 0", () => {
    const content = {
      presentation: { targetMode: "blocks" },
      targets: [
        { id: "t1", correctItemIds: ["a"] },
        { id: "t2", correctItemIds: ["b"] },
      ],
    };
    const attempt = {
      taskType: "DragDrop" as const,
      dragDrop: { assignments: { t1: "", t2: "" } },
    };
    const r = evaluateDragDrop(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(0);
  });

  it("scores dragdrop blocks mode with alternative correctItemIds (OR per target)", () => {
    const content = {
      presentation: { targetMode: "blocks" },
      targets: [{ id: "t1", correctItemIds: ["a", "b", "c"] }],
    };
    const attempt = {
      taskType: "DragDrop" as const,
      dragDrop: { assignments: { t1: ["b"] } },
    };
    const r = evaluateDragDrop(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(1);
  });

  it("rejects dragdrop blocks mode when multiple items are placed on one target", () => {
    const content = {
      presentation: { targetMode: "blocks" },
      targets: [{ id: "t1", correctItemIds: ["a", "b"] }],
    };
    const attempt = {
      taskType: "DragDrop" as const,
      dragDrop: { assignments: { t1: ["a", "b"] } },
    };
    const r = evaluateDragDrop(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(0);
  });

  it("scores dragdrop matchMode all when every listed item is in the bucket", () => {
    const content = {
      presentation: { targetMode: "blocks" },
      targets: [
        {
          id: "city-torino",
          matchMode: "all",
          correctItemIds: ["prod-gianduiotto", "prod-fiat", "prod-pinguino"],
        },
      ],
    };
    const attempt = {
      taskType: "DragDrop" as const,
      dragDrop: {
        assignments: {
          "city-torino": ["prod-gianduiotto", "prod-fiat", "prod-pinguino"],
        },
      },
    };
    const r = evaluateDragDrop(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(1);
  });

  it("special screen optional cloze blocks can be skipped when all empty", () => {
    const content = {
      blocks: [
        { blockType: "stub" },
        {
          blockType: "cloze_text",
          clozeText: {
            optional: true,
            prompt: "Identikit",
            lines: [{ segments: [{ kind: "gap", correctAnswers: ["x"] }] }],
          },
        },
      ],
    };
    const attempt = {
      taskType: "SpecialScreen" as const,
      specialScreen: {
        blocks: [
          { taskType: "Stub" as const },
          { taskType: "ClozeText" as const, clozeText: { answers: [""] } },
        ],
      },
    };
    const r = evaluateSpecialScreen(content, attempt);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected fail");
    expect(r.code).toBe("attempt_invalid");
  });

  it("special screen requires at least one completed optional cloze block", () => {
    const clozePayload = {
      optional: true,
      prompt: "Identikit",
      lines: [{ segments: [{ kind: "gap", correctAnswers: ["Roberto Saviano"] }] }],
    };
    const content = {
      blocks: [
        { blockType: "cloze_text", clozeText: clozePayload },
        {
          blockType: "cloze_text",
          clozeText: {
            optional: true,
            prompt: "Other",
            lines: [{ segments: [{ kind: "gap", correctAnswers: ["y"] }] }],
          },
        },
      ],
    };
    const attempt = {
      taskType: "SpecialScreen" as const,
      specialScreen: {
        blocks: [
          { taskType: "ClozeText" as const, clozeText: { answers: ["Roberto Saviano"] } },
          { taskType: "ClozeText" as const, clozeText: { answers: [""] } },
        ],
      },
    };
    const r = evaluateSpecialScreen(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(1);
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

  it("special screen with empty blocks[] accepts empty attempt (photo-only chrome)", () => {
    const content = { blocks: [] };
    const attempt = {
      taskType: "SpecialScreen" as const,
      specialScreen: { blocks: [] },
    };
    const r = evaluateSpecialScreen(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(1);
    expect(r.pizzaRatio).toBe(0);
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

  it("ignores false positive selection when true error is fixed", () => {
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
    expect(r.ratio).toBe(1);
    expect(r.itemsCorrect).toBe(1);
    expect(r.itemsTotal).toBe(1);
  });

  it("scores missed true errors when learner leaves them unselected", () => {
    const content = {
      segments: [
        { id: "e1", isError: true, acceptedCorrections: ["uno"] },
        { id: "e2", isError: true, acceptedCorrections: ["due"] },
      ],
    };
    const attempt = {
      taskType: "ErrorSpotting" as const,
      errorSpotting: {
        selectedSegmentIds: ["e1"],
        corrections: { e1: "uno" },
      },
    };
    const r = evaluateErrorSpotting(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(0.5);
    expect(r.itemsCorrect).toBe(1);
    expect(r.itemsTotal).toBe(2);
  });

  it("scores partial fixes without false-positive penalty", () => {
    const content = {
      segments: [
        { id: "e1", isError: true, acceptedCorrections: ["uno"] },
        { id: "e2", isError: true, acceptedCorrections: ["due"] },
      ],
    };
    const attempt = {
      taskType: "ErrorSpotting" as const,
      errorSpotting: {
        selectedSegmentIds: ["e1", "noise"],
        corrections: { e1: "uno", noise: "x" },
      },
    };
    const r = evaluateErrorSpotting(content, attempt);
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("fail");
    expect(r.ratio).toBe(0.5);
    expect(r.itemsCorrect).toBe(1);
    expect(r.itemsTotal).toBe(2);
  });
});
