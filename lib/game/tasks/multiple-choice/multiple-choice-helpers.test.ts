import { describe, expect, it } from "vitest";
import { buildMcAttempt } from "@/lib/game/tasks/multiple-choice/build-mc-attempt";
import {
  getStableMcDisplayOptions,
  mcQuestionCacheKey,
} from "@/lib/game/tasks/multiple-choice/mc-display-options";
import { nextMcRadioSelection } from "@/lib/game/tasks/multiple-choice/mc-option-keyboard";
import {
  createEmptyMcSelections,
  isMcMultiSelect,
  normalizeMcContentResult,
} from "@/lib/game/tasks/multiple-choice/normalize-mc-content";
import { shuffleMcOptions } from "@/lib/game/tasks/multiple-choice/shuffle-options";
import { validateMcSelections } from "@/lib/game/tasks/multiple-choice/validate-mc-selections";

describe("multiple-choice helpers", () => {
  it("normalizes flat task payload via schema parse", () => {
    const result = normalizeMcContentResult({
      selectionMode: "single",
      prompt: "Ciao?",
      options: [
        { id: "a", text: "A" },
        { id: "b", label: "B" },
      ],
      correctOptionIds: ["a"],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.content.questions).toHaveLength(1);
    expect(result.content.questions[0]?.options).toEqual([
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ]);
  });

  it("rejects flat and questions[] together", () => {
    const result = normalizeMcContentResult({
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      correctOptionIds: ["a"],
      questions: [
        {
          options: [
            { id: "x", label: "X" },
            { id: "y", label: "Y" },
          ],
          correctOptionIds: ["x"],
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("detects multi-select mode", () => {
    expect(isMcMultiSelect("multi")).toBe(true);
    expect(isMcMultiSelect("single")).toBe(false);
  });

  it("builds attempt payload", () => {
    const attempt = buildMcAttempt([["a"], ["b", "c"]]);
    expect(attempt).toEqual({
      taskType: "MultipleChoice",
      multipleChoice: { selections: [["a"], ["b", "c"]] },
    });
  });

  it("validates unanswered questions and length mismatch", () => {
    const content = {
      questions: [
        {
          id: "q1",
          selectionMode: "single",
          preserveOptionOrder: true,
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ],
        },
        {
          id: "q2",
          selectionMode: "single",
          preserveOptionOrder: true,
          options: [
            { id: "c", label: "C" },
            { id: "d", label: "D" },
          ],
        },
      ],
    };
    const empty = createEmptyMcSelections(2);
    const unanswered = validateMcSelections(content, empty);
    expect(unanswered.ok).toBe(false);
    if (unanswered.ok) throw new Error("expected failure");
    expect(unanswered.firstUnansweredIndex).toBe(0);

    const mismatch = validateMcSelections(content, [["a"]]);
    expect(mismatch.ok).toBe(false);
    if (mismatch.ok) throw new Error("expected failure");
    expect(mismatch.message).toMatch(/non valido/i);
  });

  it("keeps stable shuffled order per cache key", () => {
    const question = {
      id: "q1",
      selectionMode: "single",
      preserveOptionOrder: false,
      options: [
        { id: "1", label: "one" },
        { id: "2", label: "two" },
        { id: "3", label: "three" },
      ],
    };
    const cache = new Map<string, { id: string; label: string }[]>();
    const key = mcQuestionCacheKey("scene-1", question, 0);
    const first = getStableMcDisplayOptions(question, key, cache);
    const second = getStableMcDisplayOptions(question, key, cache);
    expect(first.map((o) => o.id)).toEqual(second.map((o) => o.id));
  });

  it("shuffles options when not preserving order", () => {
    const input = [
      { id: "1", label: "one" },
      { id: "2", label: "two" },
      { id: "3", label: "three" },
    ];
    const shuffled = shuffleMcOptions(input);
    expect(shuffled).toHaveLength(3);
    expect(new Set(shuffled.map((o) => o.id))).toEqual(new Set(["1", "2", "3"]));
  });

  it("moves radio selection with arrow keys", () => {
    const options = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
    ];
    expect(nextMcRadioSelection(options, ["a"], "next")).toEqual(["b"]);
    expect(nextMcRadioSelection(options, ["a"], "prev")).toEqual(["c"]);
  });
});
