import { describe, expect, it } from "vitest";
import { getPreviousProgressionChapter } from "@/lib/game/chapter-progression";

const ordered = [
  { id: "chapter-00", reference: true },
  { id: "chapter-01", reference: false },
  { id: "chapter-02", reference: false },
];

describe("chapter-progression", () => {
  it("skips reference chapters when finding previous progression chapter", () => {
    expect(getPreviousProgressionChapter(ordered, "chapter-00")).toBeNull();
    expect(getPreviousProgressionChapter(ordered, "chapter-01")).toBeNull();
    expect(getPreviousProgressionChapter(ordered, "chapter-02")?.id).toBe("chapter-01");
  });
});
