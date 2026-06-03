import { describe, expect, it } from "vitest";
import { normalizeDragDropContentResult } from "@/lib/game/tasks/drag-drop/normalize-drag-drop-content";
import { normalizeErrorSpottingContentResult } from "@/lib/game/tasks/error-spotting/normalize-error-spotting-content";
import { normalizeFreitextContentResult } from "@/lib/game/tasks/freitext/normalize-freitext-content";
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

  it("removes correctItemIds from drag_drop targets", () => {
    const sanitized = sanitizeTaskPayloadForClient("drag_drop", {
      items: [{ id: "a", label: "A" }],
      targets: [{ id: "t1", title: "T", correctItemIds: ["a"] }],
      lines: [{ segments: [{ kind: "slot", targetId: "t1" }] }],
    });
    expect(sanitized).toEqual({
      items: [{ id: "a", label: "A" }],
      targets: [{ id: "t1", title: "T" }],
    });
    expect(sanitized).not.toHaveProperty("lines");
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

  it("removes pool authoring fields from matching", () => {
    const sanitized = sanitizeTaskPayloadForClient("matching", {
      prompt: "Match",
      sampleSize: 2,
      poolPairs: [{ id: "a", leftLabel: "ciao", rightLabel: "hello" }],
      leftItems: [{ id: "l1", label: "A" }],
      rightItems: [{ id: "r1", label: "B" }],
      correctPairs: [{ leftItemId: "l1", rightItemId: "r1" }],
    });
    expect(sanitized).toEqual({
      prompt: "Match",
      leftItems: [{ id: "l1", label: "A" }],
      rightItems: [{ id: "r1", label: "B" }],
    });
  });

  it("removes evaluation rubric from free_text", () => {
    const sanitized = sanitizeTaskPayloadForClient("free_text", {
      prompt: "Presentati",
      minWords: 2,
      evaluation: {
        grammarWeight: 1,
        vocabularyWeight: 1,
        registerWeight: 1,
        passThreshold: 0.6,
        evaluationCriteria: ["Use a greeting"],
      },
    });
    expect(sanitized).toEqual({ prompt: "Presentati", minWords: 2 });
    expect(sanitized).not.toHaveProperty("evaluation");
  });

  it("removes acceptedCorrections and isError from error_spotting segments", () => {
    const sanitized = sanitizeTaskPayloadForClient("error_spotting", {
      prompt: "Trova l'errore",
      segments: [
        { id: "a", text: "Maria", isError: false },
        { id: "b", text: " vai", isError: true, acceptedCorrections: ["va"] },
      ],
    });
    expect(sanitized).toEqual({
      prompt: "Trova l'errore",
      expectedErrorRange: { min: 1, max: 1 },
      segments: [
        { id: "a", text: "Maria" },
        { id: "b", text: " vai" },
      ],
    });
  });

  it("removes correctAnswers from cloze gap segments", () => {
    const sanitized = sanitizeTaskPayloadForClient("cloze", {
      prompt: "Completa.",
      lines: [
        {
          segments: [
            { kind: "text", text: "Il " },
            { kind: "gap", placeholder: "…", correctAnswers: ["gatto"] },
          ],
        },
      ],
    });
    expect(sanitized).toEqual({
      prompt: "Completa.",
      lines: [{ segments: [{ kind: "text", text: "Il " }, { kind: "gap", placeholder: "…" }] }],
    });
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

  it("keeps shell referenceDocument with figures when sanitizing nested task", () => {
    const ref = {
      title: "Foto",
      figures: [{ image: "chapters/02/quests/02/ref-prof-architetto", caption: "l'architetto" }],
    };
    const sanitized = sanitizeSceneContentForClient("task", "free_text", {
      title: "Descrivi",
      referenceDocument: ref,
      task: {
        prompt: "Scrivi.",
        evaluation: { passThreshold: 0.65, grammarWeight: 1, vocabularyWeight: 1, registerWeight: 1 },
      },
    });
    expect(sanitized.referenceDocument).toEqual(ref);
  });

  it("still normalizes drag_drop after answer keys are stripped", () => {
    const sanitized = sanitizeTaskPayloadForClient("drag_drop", {
      items: [{ id: "a", label: "A" }],
      targets: [{ id: "t1", correctItemIds: ["a"] }],
    });
    const normalized = normalizeDragDropContentResult(sanitized);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) throw new Error("expected ok");
    expect(normalized.content.targets).toHaveLength(1);
    expect(normalized.content.items).toHaveLength(1);
  });

  it("still normalizes free_text after evaluation rubric is stripped", () => {
    const sanitized = sanitizeSceneContentForClient("task", "free_text", {
      title: "Presentati",
      instruction: "Scrivi due frasi in italiano.",
      task: {
        prompt: "Come ti presenteresti?",
        minWords: 2,
        maxWords: 40,
        showWordCount: true,
        evaluation: {
          grammarWeight: 1,
          vocabularyWeight: 1,
          registerWeight: 1,
          passThreshold: 0.6,
        },
      },
    });
    const normalized = normalizeFreitextContentResult(
      sanitized.task as Record<string, unknown>,
      sanitized.instruction as string,
    );
    expect(normalized.ok).toBe(true);
  });

  it("still normalizes error_spotting after answer keys are stripped", () => {
    const sanitized = sanitizeTaskPayloadForClient("error_spotting", {
      prompt: "Trova l'errore",
      segments: [
        { id: "a", text: "Maria", isError: false },
        { id: "b", text: " vai", isError: true, acceptedCorrections: ["va"] },
      ],
    });
    const normalized = normalizeErrorSpottingContentResult(sanitized);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) throw new Error("expected ok");
    expect(normalized.content.segments).toHaveLength(2);
    expect(normalized.content.errorCount).toBe(1);
  });
});
