import { describe, expect, it } from "vitest";
import { normalizeMatchingContentResult } from "@/lib/game/tasks/matching/normalize-matching-content";
import {
  sanitizeSceneContentForClient,
  sanitizeTaskPayloadForClient,
} from "@/lib/game/content/sanitize-task-payload-for-client";

describe("sanitizeTaskPayloadForClient", () => {
  it("removes correctOptionIds from flat multiple choice", () => {
    const sanitized = sanitizeTaskPayloadForClient("multiple_choice", {
      options: [{ id: "a", label: "A" }],
      correctOptionIds: ["a"],
    });
    expect(sanitized).toEqual({ options: [{ id: "a", label: "A" }] });
    expect(sanitized).not.toHaveProperty("correctOptionIds");
  });

  it("removes correctOptionIds from each MC question", () => {
    const sanitized = sanitizeTaskPayloadForClient("multiple_choice", {
      questions: [
        {
          prompt: "Q1",
          options: [{ id: "a", label: "A" }],
          correctOptionIds: ["a"],
        },
      ],
    });
    expect(sanitized.questions).toEqual([
      {
        prompt: "Q1",
        options: [{ id: "a", label: "A" }],
      },
    ]);
  });

  it("removes correctPairs from matching", () => {
    const sanitized = sanitizeTaskPayloadForClient("matching", {
      leftItems: [{ id: "l1", label: "A" }],
      rightItems: [{ id: "r1", label: "B" }],
      correctPairs: [{ leftItemId: "l1", rightItemId: "r1" }],
    });
    expect(sanitized).toEqual({
      leftItems: [{ id: "l1", label: "A" }],
      rightItems: [{ id: "r1", label: "B" }],
    });
  });

  it("leaves other task types unchanged", () => {
    const payload = { prompt: "x", answers: ["secret"] };
    expect(sanitizeTaskPayloadForClient("cloze", payload)).toEqual(payload);
  });
});

describe("sanitizeSceneContentForClient", () => {
  it("sanitizes nested content.task for task scenes", () => {
    const sanitized = sanitizeSceneContentForClient("task", "matching", {
      title: "Abbina",
      task: {
        leftItems: [{ id: "l1", label: "A" }],
        rightItems: [{ id: "r1", label: "B" }],
        correctPairs: [{ leftItemId: "l1", rightItemId: "r1" }],
      },
    });
    expect(sanitized.title).toBe("Abbina");
    expect(sanitized.task).toEqual({
      leftItems: [{ id: "l1", label: "A" }],
      rightItems: [{ id: "r1", label: "B" }],
    });
  });

  it("does not mutate story scene content", () => {
    const content = { text: "Ciao" };
    expect(sanitizeSceneContentForClient("story", "info", content)).toEqual(content);
  });

  it("still normalizes matching after answer keys are stripped", () => {
    const sanitized = sanitizeTaskPayloadForClient("matching", {
      leftItems: [{ id: "l1", label: "A" }],
      rightItems: [{ id: "r1", label: "B" }],
      correctPairs: [{ leftItemId: "l1", rightItemId: "r1" }],
    });
    const normalized = normalizeMatchingContentResult(sanitized);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) throw new Error("expected ok");
    expect(normalized.content.leftItems).toHaveLength(1);
  });
});
