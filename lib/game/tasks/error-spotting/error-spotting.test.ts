import { describe, expect, it } from "vitest";
import { buildErrorSpottingAttempt } from "@/lib/game/tasks/error-spotting/build-error-spotting-attempt";
import { formatErrorSpottingCaption } from "@/lib/game/tasks/error-spotting/format-error-spotting-caption";
import { normalizeErrorSpottingContentResult } from "@/lib/game/tasks/error-spotting/normalize-error-spotting-content";

describe("error spotting helpers", () => {
  const taskPayload = {
    prompt: "Trova l'errore",
    segments: [
      { id: "a", text: "Maria", isError: false },
      { id: "b", text: " vai", isError: true, acceptedCorrections: ["va"] },
    ],
  };

  it("normalizes sanitized content without answer keys", () => {
    const normalized = normalizeErrorSpottingContentResult(taskPayload);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) throw new Error("expected ok");
    expect(normalized.content.segments.map((segment) => segment.id)).toEqual(["a", "b"]);
    expect(normalized.content.errorCount).toBe(1);
  });

  it("formats default caption for one error", () => {
    expect(
      formatErrorSpottingCaption({
        errorCount: 1,
        expectedErrorRange: { min: 1, max: 1 },
      }),
    ).toBe("Nel testo c'è 1 errore. Trovalo.");
  });

  it("builds attempt payload from draft", () => {
    const attempt = buildErrorSpottingAttempt({
      selectedSegmentIds: ["b", "noise"],
    });
    expect(attempt).toEqual({
      taskType: "ErrorSpotting",
      errorSpotting: {
        selectedSegmentIds: ["b", "noise"],
      },
    });
  });
});

describe("validateErrorSpottingSegmentText", () => {
  it("rejects trailing whitespace on segments", async () => {
    const { validateErrorSpottingSegmentText } = await import(
      "@/lib/game/tasks/error-spotting/validate-error-spotting-segment-text"
    );
    expect(validateErrorSpottingSegmentText("vai ", 0).ok).toBe(false);
  });

  it("rejects standalone punctuation segments", async () => {
    const { validateErrorSpottingSegmentText } = await import(
      "@/lib/game/tasks/error-spotting/validate-error-spotting-segment-text"
    );
    expect(validateErrorSpottingSegmentText(".", 1).ok).toBe(false);
  });

  it("accepts leading space on non-first segments", async () => {
    const { validateErrorSpottingSegmentText } = await import(
      "@/lib/game/tasks/error-spotting/validate-error-spotting-segment-text"
    );
    expect(validateErrorSpottingSegmentText(" vai", 1).ok).toBe(true);
  });
});
