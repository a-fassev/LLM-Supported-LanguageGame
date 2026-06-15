import { describe, expect, it } from "vitest";
import { formatFreitextStatsLine } from "@/lib/game/tasks/freitext/freitext-stats-line";
import type { NormalizedFreitextContent } from "@/lib/game/tasks/freitext/normalize-freitext-content";

const content: NormalizedFreitextContent = {
  prompt: "Q",
  minWords: 2,
  showWordCount: true,
  showCharacterCount: false,
};

describe("formatFreitextStatsLine", () => {
  it("shows written words and minimum hint for children", () => {
    expect(formatFreitextStatsLine(content, "")).toBe("Parole scritte: 0 (almeno 2)");
    expect(formatFreitextStatsLine(content, "Ciao, mi chiamo Luca.")).toBe(
      "Parole scritte: 4 (almeno 2)",
    );
  });

  it("shows character count without an upper limit", () => {
    const withChars = { ...content, showWordCount: false, showCharacterCount: true, minWords: 0 };
    expect(formatFreitextStatsLine(withChars, "Ciao!")).toBe("Caratteri: 5");
  });
});
