import { describe, expect, it } from "vitest";
import { toReferenceDocumentView } from "@/lib/game/reference-document-view";
import { sanitizeSceneContentForClient } from "@/lib/game/content/sanitize-task-payload-for-client";

describe("referenceDocument on run snapshots", () => {
  const shellRef = {
    documentId: "ch02-quiz-persons",
    title: "Chi sono?",
    body: "Ecco le sei persone del quiz.",
    figures: [
      { image: "chapters/02/quests/03/ref-quiz-verdi", caption: "Giuseppe Verdi" },
      { image: "chapters/02/quests/03/ref-quiz-colombo", caption: "Cristoforo Colombo" },
      { image: "chapters/02/quests/03/ref-quiz-montessori", caption: "Maria Montessori" },
      { image: "chapters/02/quests/03/ref-quiz-michelangelo", caption: "Michelangelo Buonarroti" },
      { image: "chapters/02/quests/03/ref-quiz-ferrante", caption: "Elena Ferrante" },
      { image: "chapters/02/quests/03/ref-quiz-da-vinci", caption: "Leonardo da Vinci" },
    ],
  };

  it("preserves shell referenceDocument through client sanitization (multiple_choice)", () => {
    const sanitized = sanitizeSceneContentForClient("task", "multiple_choice", {
      title: "Quiz",
      instruction: "Scegli.",
      referenceDocument: shellRef,
      task: {
        questions: [
          {
            id: "q1",
            prompt: "Grammar?",
            options: [
              { id: "a", label: "che · ha fondato" },
              { id: "b", label: "dove · ha fondato" },
            ],
            correctOptionIds: ["a"],
          },
        ],
      },
    });

    const view = toReferenceDocumentView(sanitized.referenceDocument);
    expect(view?.title).toBe("Chi sono?");
    expect(view?.figures).toHaveLength(6);
    expect(view?.body).toBe("Ecco le sei persone del quiz.");
  });

  it("preserves shell sections on cloze scenes", () => {
    const sanitized = sanitizeSceneContentForClient("task", "cloze", {
      title: "Steckbrief",
      referenceDocument: {
        title: "Profili",
        body: "Intro.",
        sections: [
          { title: "Saviano", body: "Testo…" },
          { title: "Del Piero", body: "Testo…" },
          { title: "Ferragni", body: "Testo…" },
        ],
      },
      task: {
        prompt: "Completa.",
        lines: [{ segments: [{ kind: "text", text: "nome: " }, { kind: "gap", correctAnswers: ["x"] }] }],
      },
    });

    const view = toReferenceDocumentView(sanitized.referenceDocument);
    expect(view?.sections).toHaveLength(3);
  });
});
