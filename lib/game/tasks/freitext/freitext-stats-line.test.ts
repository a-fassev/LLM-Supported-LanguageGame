import { describe, expect, it } from "vitest";
import { formatFreitextStatsLine } from "@/lib/game/tasks/freitext/freitext-stats-line";
import type { NormalizedFreitextContent } from "@/lib/game/tasks/freitext/normalize-freitext-content";

const content: NormalizedFreitextContent = {
  prompt: "Q",
  minWords: 2,
  maxWords: 40,
  showWordCount: true,
  showCharacterCount: false,
};

describe("formatFreitextStatsLine", () => {
  it("shows written words and min/max range for children", () => {
    expect(formatFreitextStatsLine(content, "")).toBe("Parole scritte: 0 (da 2 a 40)");
    expect(formatFreitextStatsLine(content, "Ciao, mi chiamo Luca.")).toBe(
      "Parole scritte: 4 (da 2 a 40)",
    );
  });
});
