import { describe, expect, it } from "vitest";
import { parseClozeTextContent } from "@/lib/game/schemas/clozeTextContentSchema";
import { parseDragDropContent } from "@/lib/game/schemas/dragDropContentSchema";
import { parseErrorSpottingContent } from "@/lib/game/schemas/errorSpottingContentSchema";
import { parseMatchingContent } from "@/lib/game/schemas/matchingContentSchema";
import { parseMultipleChoiceContent } from "@/lib/game/schemas/multipleChoiceContentSchema";
import { parseSpecialScreenContent } from "@/lib/game/schemas/specialScreenContentSchema";
import { parseFreitextLlmStepContent } from "@/lib/llm/freitextLlmContentSchema";

const stepReferenceDocument = {
  documentId: "doc-step",
  title: "Documento",
  bodyText: "Testo completo.",
  buttonLabel: "Apri",
};

describe("task content schemas with step referenceDocument", () => {
  it("accepts referenceDocument in multiple choice content", () => {
    const parsed = parseMultipleChoiceContent({
      prompt: "Q",
      referenceDocument: stepReferenceDocument,
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      correctOptionIds: ["a"],
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts referenceDocument in drag-drop content", () => {
    const parsed = parseDragDropContent({
      prompt: "Q",
      referenceDocument: stepReferenceDocument,
      items: [{ id: "i1", label: "Item" }],
      targets: [{ id: "t1", correctItemIds: ["i1"] }],
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts referenceDocument in cloze text content", () => {
    const parsed = parseClozeTextContent({
      prompt: "Q",
      referenceDocument: stepReferenceDocument,
      lines: [
        {
          segments: [
            { kind: "text", text: "ciao " },
            { kind: "gap", correctAnswers: ["mondo"] },
          ],
        },
      ],
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts referenceDocument in matching content", () => {
    const parsed = parseMatchingContent({
      prompt: "Q",
      referenceDocument: stepReferenceDocument,
      leftItems: [{ id: "l1", label: "L" }],
      rightItems: [{ id: "r1", label: "R" }],
      correctPairs: [{ leftItemId: "l1", rightItemId: "r1" }],
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts referenceDocument in error spotting content", () => {
    const parsed = parseErrorSpottingContent({
      prompt: "Q",
      referenceDocument: stepReferenceDocument,
      segments: [
        { id: "a", text: "Maria", isError: false },
        { id: "b", text: " vai", isError: true, acceptedCorrections: ["va"] },
        { id: "c", text: " a scuola.", isError: false },
      ],
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts referenceDocument in special screen content", () => {
    const parsed = parseSpecialScreenContent({
      title: "Screen",
      referenceDocument: stepReferenceDocument,
      blocks: [{ blockType: "stub", stub: { headline: "H", body: "B" } }],
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts referenceDocument in freitext llm content", () => {
    const parsed = parseFreitextLlmStepContent({
      prompt: "Q",
      referenceDocument: stepReferenceDocument,
      evaluation: {
        grammarWeight: 1,
        vocabularyWeight: 1,
        registerWeight: 1,
        passThreshold: 0.5,
      },
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.evaluation.taskFulfillmentWeight).toBe(1);
    }
  });

  it("rejects invalid referenceDocument shape", () => {
    const parsed = parseMultipleChoiceContent({
      prompt: "Q",
      referenceDocument: {
        title: "Missing body",
      },
      options: [{ id: "a", label: "A" }],
      correctOptionIds: ["a"],
    });
    expect(parsed.ok).toBe(false);
  });
});

