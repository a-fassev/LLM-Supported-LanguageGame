import { describe, expect, it } from "vitest";
import { buildClozeAttempt } from "@/lib/game/tasks/cloze/build-cloze-attempt";
import {
  collectOptionalClozeGapIndexes,
  countClozeGaps,
  createEmptyClozeAnswers,
} from "@/lib/game/tasks/cloze/cloze-gap-order";
import { normalizeClozeContentResult } from "@/lib/game/tasks/cloze/normalize-cloze-content";
import {
  CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE,
  CLOZE_INCOMPLETE_MESSAGE,
} from "@/lib/game/tasks/cloze/cloze-types";
import { validateClozeDraft } from "@/lib/game/tasks/cloze/validate-cloze-draft";

const sampleLines = [
  {
    segments: [
      { kind: "text" as const, text: "Ciao " },
      { kind: "gap" as const, placeholder: "…" },
      { kind: "text" as const, text: " mondo" },
    ],
  },
  {
    segments: [
      { kind: "text" as const, text: "Io " },
      { kind: "gap" as const },
    ],
  },
];

describe("cloze-gap-order", () => {
  it("counts gaps in line order", () => {
    expect(countClozeGaps(sampleLines)).toBe(2);
  });

  it("creates empty answers", () => {
    expect(createEmptyClozeAnswers(2)).toEqual(["", ""]);
  });

  it("collects optional gap indexes in display order", () => {
    expect(
      Array.from(
        collectOptionalClozeGapIndexes([
          {
            segments: [
              { kind: "gap" as const },
              { kind: "text" as const, text: " " },
              { kind: "gap" as const, optional: true },
            ],
          },
          {
            segments: [
              { kind: "gap" as const },
              { kind: "gap" as const, optional: true },
            ],
          },
        ]),
      ),
    ).toEqual([1, 3]);
  });
});

describe("validateClozeDraft", () => {
  it("rejects empty answers array when gaps expected", () => {
    expect(validateClozeDraft([], 2)).toEqual({
      ok: false,
      message: CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE,
    });
  });

  it("rejects wrong answer count", () => {
    expect(validateClozeDraft(["a"], 2)).toEqual({
      ok: false,
      message: CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE,
    });
  });

  it("rejects empty gap", () => {
    expect(validateClozeDraft(["a", ""], 2)).toEqual({
      ok: false,
      message: CLOZE_INCOMPLETE_MESSAGE,
    });
  });

  it("accepts empty optional gaps", () => {
    expect(validateClozeDraft(["a", ""], 2, new Set([1]))).toEqual({ ok: true });
  });

  it("accepts all filled", () => {
    expect(validateClozeDraft(["a", "b"], 2)).toEqual({ ok: true });
  });
});

describe("normalizeClozeContentResult", () => {
  it("strips correctAnswers before client parse", () => {
    const result = normalizeClozeContentResult({
      prompt: "Completa.",
      lines: [
        {
          segments: [
            { kind: "text", text: "Ciao " },
            { kind: "gap", placeholder: "…", correctAnswers: ["mondo"] },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    const gap = result.content.lines[0]?.segments.find((segment) => segment.kind === "gap");
    expect(gap).toBeDefined();
    expect(gap).not.toHaveProperty("correctAnswers");
  });
});

describe("buildClozeAttempt", () => {
  it("trims answers", () => {
    expect(buildClozeAttempt(["  ciao ", "mondo"])).toEqual({
      taskType: "ClozeText",
      clozeText: { answers: ["ciao", "mondo"] },
    });
  });
});
