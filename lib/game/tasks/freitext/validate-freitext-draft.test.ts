import { describe, expect, it } from "vitest";
import {
  FREITEXT_ANSWER_EMPTY_MESSAGE,
  FREITEXT_ANSWER_TEMPLATE_STRUCTURE_MESSAGE,
  FREITEXT_ANSWER_UNCHANGED_TEMPLATE_MESSAGE,
} from "@/lib/game/tasks/freitext/freitext-messages";
import type { NormalizedFreitextContent } from "@/lib/game/tasks/freitext/normalize-freitext-content";
import { validateFreitextDraft } from "@/lib/game/tasks/freitext/validate-freitext-draft";

const baseContent: NormalizedFreitextContent = {
  prompt: "Q",
  minWords: 2,
  showWordCount: true,
  showCharacterCount: false,
};

const identikitTemplate = "nome:\nanno di nascita:\nparticolarità:";

describe("validateFreitextDraft", () => {
  it("rejects empty answers", () => {
    const result = validateFreitextDraft(baseContent, "   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(FREITEXT_ANSWER_EMPTY_MESSAGE);
    }
  });

  it("rejects unchanged initialAnswerText template", () => {
    const content = { ...baseContent, initialAnswerText: identikitTemplate, minWords: 0 };
    const result = validateFreitextDraft(content, identikitTemplate);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(FREITEXT_ANSWER_UNCHANGED_TEMPLATE_MESSAGE);
    }
  });

  it("accepts answers that extend the initialAnswerText template", () => {
    const content = { ...baseContent, initialAnswerText: identikitTemplate, minWords: 0 };
    const result = validateFreitextDraft(
      content,
      `${identikitTemplate}\nRoberto Saviano`,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects answers that remove template structure lines", () => {
    const content = { ...baseContent, initialAnswerText: identikitTemplate, minWords: 0 };
    const result = validateFreitextDraft(content, "nome: Roberto Saviano");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(FREITEXT_ANSWER_TEMPLATE_STRUCTURE_MESSAGE);
    }
  });

  it("applies minWords only to words beyond the template", () => {
    const content = { ...baseContent, initialAnswerText: identikitTemplate, minWords: 3 };
    const onlyOneAddedWord = validateFreitextDraft(
      content,
      `nome: Roberto\n${identikitTemplate.split("\n").slice(1).join("\n")}`,
    );
    expect(onlyOneAddedWord.ok).toBe(false);

    const enoughAdded = validateFreitextDraft(
      content,
      "nome: Roberto Saviano\nanno di nascita: 1979\nregione d'origine: Campania\nprofessione:\nÈ famoso/a perché\nparticolarità:",
    );
    expect(enoughAdded.ok).toBe(true);
  });

  it("rejects answers below minWords", () => {
    const result = validateFreitextDraft(baseContent, "Ciao");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("2");
    }
  });

  it("accepts valid answers", () => {
    const result = validateFreitextDraft(baseContent, "Ciao, mi chiamo Luca.");
    expect(result.ok).toBe(true);
  });

  it("does not enforce a word upper limit", () => {
    const longAnswer = Array.from({ length: 50 }, (_, i) => `parola${i}`).join(" ");
    const result = validateFreitextDraft(baseContent, longAnswer);
    expect(result.ok).toBe(true);
  });

  it("does not enforce a character upper limit", () => {
    const noMin = { ...baseContent, minWords: 0 };
    const result = validateFreitextDraft(noMin, "a".repeat(10_000));
    expect(result.ok).toBe(true);
  });
});
