import { describe, expect, it } from "vitest";
import { parseMatchingClientContent, parseMatchingContent } from "@/lib/game/schemas/matchingContentSchema";

const concreteMatching = {
  leftItems: [{ id: "l1", label: "A" }],
  rightItems: [
    { id: "r1", label: "B" },
    { id: "r2", label: "C" },
  ],
  correctPairs: [{ leftItemId: "l1", rightItemId: "r1" }],
};

describe("matchingContentSchema", () => {
  it("accepts concrete matching with label", () => {
    const parsed = parseMatchingContent(concreteMatching);
    expect(parsed.ok).toBe(true);
  });

  it("accepts legacy text field as label", () => {
    const parsed = parseMatchingContent({
      ...concreteMatching,
      leftItems: [{ id: "l1", text: "A" }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("expected ok");
    expect(parsed.value.leftItems?.[0]?.label).toBe("A");
  });

  it("rejects asset-only items without label", () => {
    const parsed = parseMatchingContent({
      ...concreteMatching,
      leftItems: [{ id: "l1", assetId: "chapters/01/icon" }],
    });
    expect(parsed.ok).toBe(false);
  });

  it("allows pool authoring at schema boundary without concrete items", () => {
    const parsed = parseMatchingContent({
      poolPairs: [{ id: "p1", leftLabel: "ciao", rightLabel: "hello" }],
      sampleSize: 1,
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("schema allows pool for API boundary");
    expect(parsed.value.leftItems).toBeUndefined();
    expect(parsed.value.correctPairs).toBeUndefined();
  });

  it("accepts client payload without correctPairs", () => {
    const parsed = parseMatchingClientContent({
      leftItems: [{ id: "l1", label: "A" }],
      rightItems: [{ id: "r1", label: "B" }],
    });
    expect(parsed.ok).toBe(true);
  });
});
