import { describe, expect, it } from "vitest";
import { parseDragDropClientContent, parseDragDropContent } from "@/lib/game/schemas/dragDropContentSchema";

const minimalBlocks = {
  prompt: "Q",
  items: [{ id: "a", label: "A" }],
  targets: [{ id: "t1", correctItemIds: ["a"] }],
};

describe("parseDragDropClientContent", () => {
  it("returns parsed data for minimal blocks payload without answers", () => {
    const parsed = parseDragDropClientContent({
      items: [{ id: "a", label: "A" }],
      targets: [{ id: "t1", title: "T" }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("expected ok");
    expect(parsed.value.items[0]?.label).toBe("A");
    expect(parsed.value.targets[0]?.id).toBe("t1");
  });
});

describe("parseDragDropContent", () => {
  it("accepts minimal blocks payload", () => {
    const parsed = parseDragDropContent(minimalBlocks);
    expect(parsed.ok).toBe(true);
  });

  it("accepts matchMode all bucket", () => {
    const parsed = parseDragDropContent({
      items: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      targets: [{ id: "bucket", matchMode: "all", correctItemIds: ["a", "b"] }],
    });
    expect(parsed.ok).toBe(true);
  });

  it("accepts label via legacy text field", () => {
    const parsed = parseDragDropContent({
      items: [{ id: "a", text: "Parola" }],
      targets: [{ id: "t1", correctItemIds: ["a"] }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error("expected ok");
    expect(parsed.value.items[0].label).toBe("Parola");
  });

  it("rejects lines mode in web catalog", () => {
    const parsed = parseDragDropContent({
      ...minimalBlocks,
      presentation: { targetMode: "lines" },
    });
    expect(parsed.ok).toBe(false);
  });

  it("rejects empty targets", () => {
    const parsed = parseDragDropContent({
      items: [{ id: "a", label: "A" }],
      targets: [],
    });
    expect(parsed.ok).toBe(false);
  });

  it("rejects unknown correctItemIds", () => {
    const parsed = parseDragDropContent({
      items: [{ id: "a", label: "A" }],
      targets: [{ id: "t1", correctItemIds: ["missing"] }],
    });
    expect(parsed.ok).toBe(false);
  });

  it("rejects invalid matchMode", () => {
    const parsed = parseDragDropContent({
      items: [{ id: "a", label: "A" }],
      targets: [{ id: "t1", matchMode: "alll", correctItemIds: ["a"] }],
    });
    expect(parsed.ok).toBe(false);
  });
});
