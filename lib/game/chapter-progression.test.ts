import { describe, expect, it } from "vitest";
import { getPreviousProgressionChapter } from "@/lib/game/chapter-progression";

const ordered = [
  { id: "chapter-00", reference: false },
  { id: "chapter-01", reference: false },
  { id: "chapter-02", reference: false },
];

describe("chapter-progression", () => {
  it("chains progression chapters including tutorial chapter-00", () => {
    expect(getPreviousProgressionChapter(ordered, "chapter-00")).toBeNull();
    expect(getPreviousProgressionChapter(ordered, "chapter-01")?.id).toBe("chapter-00");
    expect(getPreviousProgressionChapter(ordered, "chapter-02")?.id).toBe("chapter-01");
  });

  it("still skips reference chapters when finding previous progression chapter", () => {
    const withSandbox = [
      { id: "chapter-00", reference: true },
      { id: "chapter-01", reference: false },
      { id: "chapter-02", reference: false },
    ];
    expect(getPreviousProgressionChapter(withSandbox, "chapter-01")).toBeNull();
    expect(getPreviousProgressionChapter(withSandbox, "chapter-02")?.id).toBe("chapter-01");
  });
});
