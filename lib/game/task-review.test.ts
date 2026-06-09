import { describe, expect, it } from "vitest";
import { buildTaskReview } from "@/lib/game/task-review";

describe("buildTaskReview", () => {
  it("builds multiple choice review from attempt", () => {
    const review = buildTaskReview({
      screenType: "multiple_choice",
      taskContent: {
        selectionMode: "single",
        correctOptionIds: ["a"],
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
      },
      attemptPayload: {
        taskType: "MultipleChoice",
        multipleChoice: { selections: [["b"]] },
      },
    });

    expect(review?.screenType).toBe("multiple_choice");
    if (review?.screenType !== "multiple_choice") return;
    expect(review.questions[0].isCorrect).toBe(false);
    expect(review.questions[0].correctOptionIds).toEqual(["a"]);
    expect(review.questions[0].selectedIds).toEqual(["b"]);
  });

  it("builds cloze review with accepted answers", () => {
    const review = buildTaskReview({
      screenType: "cloze",
      taskContent: {
        lines: [
          {
            segments: [
              { kind: "text", text: "Ciao " },
              { kind: "gap", correctAnswers: ["mondo", "tutti"] },
            ],
          },
        ],
      },
      attemptPayload: {
        taskType: "ClozeText",
        clozeText: { answers: ["mundo"] },
      },
    });

    expect(review?.screenType).toBe("cloze");
    if (review?.screenType !== "cloze") return;
    expect(review.gaps[0].isCorrect).toBe(false);
    expect(review.gaps[0].acceptedAnswers).toEqual(["mondo", "tutti"]);
  });

  it("builds matching review from correct pairs", () => {
    const review = buildTaskReview({
      screenType: "matching",
      taskContent: {
        correctPairs: [{ leftItemId: "l1", rightItemId: "r2" }],
      },
      attemptPayload: {
        taskType: "Matching",
        matching: { pairs: { l1: "r1" } },
      },
    });

    expect(review?.screenType).toBe("matching");
    if (review?.screenType !== "matching") return;
    expect(review.pairs[0].isCorrect).toBe(false);
    expect(review.pairs[0].correctRightItemId).toBe("r2");
  });

  it("classifies error spotting segments including false positives", () => {
    const review = buildTaskReview({
      screenType: "error_spotting",
      taskContent: {
        segments: [
          { id: "s1", text: "bene", isError: false },
          {
            id: "s2",
            text: "sbagliato",
            isError: true,
            acceptedCorrections: ["giusto"],
          },
        ],
      },
      attemptPayload: {
        taskType: "ErrorSpotting",
        errorSpotting: {
          selectedSegmentIds: ["s1", "s2"],
          corrections: { s1: "x", s2: "quasi" },
        },
      },
    });

    expect(review?.screenType).toBe("error_spotting");
    if (review?.screenType !== "error_spotting") return;
    const s1 = review.segments.find((s) => s.segmentId === "s1");
    const s2 = review.segments.find((s) => s.segmentId === "s2");
    expect(s1?.isFalsePositive).toBe(true);
    expect(s2?.correctionCorrect).toBe(false);
    expect(s2?.acceptedCorrections).toEqual(["giusto"]);
  });

  it("builds freetext review from judge feedback", () => {
    const review = buildTaskReview({
      screenType: "free_text",
      taskContent: {},
      attemptPayload: {
        taskType: "FreitextLlm",
        freitextLlm: { answerText: "Ciao!" },
      },
      freetext: {
        answerText: "Ciao!",
        ratio: 0.8,
        summaryFeedback: "Bene!",
        nextStepAdvice: "Aggiungi un saluto.",
        dimensions: [
          {
            key: "grammar",
            label: "Grammatica",
            score: 0.9,
            feedback: "Ottimo.",
          },
        ],
      },
    });

    expect(review?.screenType).toBe("free_text");
    if (review?.screenType !== "free_text") return;
    expect(review.summaryFeedback).toBe("Bene!");
    expect(review.dimensions?.[0].label).toBe("Grammatica");
  });
});
