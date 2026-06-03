import { describe, expect, it } from "vitest";
import { evaluateCloze } from "@/lib/game/scoring/evaluateTaskAttempt";
import { buildClozeAttempt } from "@/lib/game/tasks/cloze/build-cloze-attempt";
import { countClozeGaps } from "@/lib/game/tasks/cloze/cloze-gap-order";

const fixtureLines = [
  {
    segments: [
      { kind: "text", text: "Ciao " },
      { kind: "gap", correctAnswers: ["Luca"] },
      { kind: "text", text: " e " },
      { kind: "gap", correctAnswers: ["Roma"] },
    ],
  },
  {
    segments: [{ kind: "gap", correctAnswers: ["bene"] }],
  },
];

describe("cloze gap order contract", () => {
  it("matches client gap count and attempt answer order", () => {
    const content = { caseSensitive: false, lines: fixtureLines };
    const gapCount = countClozeGaps(fixtureLines);
    expect(gapCount).toBe(3);

    const answers = ["Luca", "Roma", "bene"];
    const attempt = buildClozeAttempt(answers);
    expect(attempt.clozeText.answers).toHaveLength(gapCount);

    const scored = evaluateCloze(content, {
      taskType: "ClozeText",
      clozeText: attempt.clozeText,
    });
    expect(scored.ok).toBe(true);
    if (!scored.ok) throw new Error("fail");
    expect(scored.itemsTotal).toBe(gapCount);
    expect(scored.ratio).toBe(1);
  });
});
