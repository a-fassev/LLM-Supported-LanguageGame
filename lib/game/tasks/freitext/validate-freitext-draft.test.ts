import { describe, expect, it } from "vitest";
import { FREITEXT_ANSWER_EMPTY_MESSAGE } from "@/lib/game/tasks/freitext/freitext-messages";
import type { NormalizedFreitextContent } from "@/lib/game/tasks/freitext/normalize-freitext-content";
import { validateFreitextDraft } from "@/lib/game/tasks/freitext/validate-freitext-draft";

const baseContent: NormalizedFreitextContent = {
  prompt: "Q",
  minWords: 2,
  maxWords: 10,
  showWordCount: true,
  showCharacterCount: false,
};

describe("validateFreitextDraft", () => {
  it("rejects empty answers", () => {
    const result = validateFreitextDraft(baseContent, "   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(FREITEXT_ANSWER_EMPTY_MESSAGE);
    }
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
});
