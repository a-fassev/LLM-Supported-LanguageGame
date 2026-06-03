import { describe, expect, it } from "vitest";
import { buildDragDropAttempt } from "@/lib/game/tasks/drag-drop/build-drag-drop-attempt";
import { createEmptyDragDropAssignments, placeItemOnTarget } from "@/lib/game/tasks/drag-drop/drag-drop-assignment-actions";
import { validateDragDropDraft } from "@/lib/game/tasks/drag-drop/validate-drag-drop-draft";
import type { NormalizedDragDropContent } from "@/lib/game/tasks/drag-drop/drag-drop-types";

const baseContent: NormalizedDragDropContent = {
  items: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
  targets: [
    { id: "t1", matchMode: "one" },
    { id: "t2", matchMode: "one" },
  ],
  sourceLabel: "Bank",
  targetLabel: "Targets",
  shuffleItemOrder: false,
  requireBankEmpty: false,
};

describe("drag-drop helpers", () => {
  it("builds one-target assignment as string", () => {
    const attempt = buildDragDropAttempt(baseContent.targets, {
      t1: ["a"],
      t2: ["b"],
    });
    expect(attempt.dragDrop.assignments.t1).toBe("a");
    expect(attempt.dragDrop.assignments.t2).toBe("b");
  });

  it("builds all-target assignment as sorted array", () => {
    const attempt = buildDragDropAttempt([{ id: "bucket", matchMode: "all" }], {
      bucket: ["b", "a"],
    });
    expect(attempt.dragDrop.assignments.bucket).toEqual(["a", "b"]);
  });

  it("allows submit with empty zones and cards left in the bank", () => {
    const content: NormalizedDragDropContent = {
      ...baseContent,
      requireBankEmpty: true,
    };
    const draft = createEmptyDragDropAssignments(["t1", "t2"]);
    draft.t1 = ["a"];
    const result = validateDragDropDraft(content, draft);
    expect(result).toEqual({ ok: true });
  });

  it("places item on one target and evicts previous occupant to bank", () => {
    const targetIds = ["t1", "t2"];
    let draft = createEmptyDragDropAssignments(targetIds);
    draft = placeItemOnTarget(draft, "a", "t1", { id: "t1", matchMode: "one" }, targetIds);
    draft = placeItemOnTarget(draft, "b", "t2", { id: "t2", matchMode: "one" }, targetIds);
    expect(draft.t1).toEqual(["a"]);
    expect(draft.t2).toEqual(["b"]);
  });

  it("allows multiple items in the same one-mode target zone", () => {
    const targetIds = ["t1", "t2"];
    let draft = createEmptyDragDropAssignments(targetIds);
    draft = placeItemOnTarget(draft, "a", "t1", { id: "t1", matchMode: "one" }, targetIds);
    draft = placeItemOnTarget(draft, "b", "t1", { id: "t1", matchMode: "one" }, targetIds);
    expect(draft.t1).toEqual(["a", "b"]);
    expect(draft.t2).toEqual([]);
  });
});
