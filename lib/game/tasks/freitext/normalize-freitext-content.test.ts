import { describe, expect, it } from "vitest";
import { sanitizeTaskPayloadForClient } from "@/lib/game/content/sanitize-task-payload-for-client";
import { normalizeFreitextContentResult } from "@/lib/game/tasks/freitext/normalize-freitext-content";

describe("normalizeFreitextContentResult", () => {
  it("accepts sanitized client payloads without evaluation rubric", () => {
    const task = sanitizeTaskPayloadForClient("free_text", {
      prompt: "Come ti presenteresti a un nuovo compagno di classe?",
      showWordCount: true,
      minWords: 2,
      evaluation: {
        grammarWeight: 1,
        vocabularyWeight: 1,
        registerWeight: 1,
        passThreshold: 0.6,
      },
    });

    const result = normalizeFreitextContentResult(task, "Scrivi due frasi in italiano.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content.prompt).toContain("presenteresti");
      expect(result.content.minWords).toBe(2);
      expect(result.content.showWordCount).toBe(true);
    }
  });

  it("passes through initialAnswerText with newlines", () => {
    const template = "nome:\nanno di nascita:\nparticolarità:";
    const task = sanitizeTaskPayloadForClient("free_text", {
      prompt: "Completa l'identikit.",
      initialAnswerText: template,
      evaluation: {
        grammarWeight: 1,
        vocabularyWeight: 1,
        registerWeight: 1,
        passThreshold: 0.6,
      },
    });

    const result = normalizeFreitextContentResult(task);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content.initialAnswerText).toBe(template);
      expect(result.content.initialAnswerText?.split("\n").length).toBe(3);
    }
  });
});
