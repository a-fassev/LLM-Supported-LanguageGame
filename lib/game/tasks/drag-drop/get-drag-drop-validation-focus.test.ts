import { describe, expect, it } from "vitest";
import { getDragDropValidationFocus } from "@/lib/game/tasks/drag-drop/get-drag-drop-validation-focus";
import {
  DRAG_DROP_BANK_NOT_EMPTY_MESSAGE,
  DRAG_DROP_INCOMPLETE_ZONES_MESSAGE,
  type NormalizedDragDropContent,
} from "@/lib/game/tasks/drag-drop/drag-drop-types";
import { createEmptyDragDropAssignments } from "@/lib/game/tasks/drag-drop/drag-drop-assignment-actions";

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

describe("getDragDropValidationFocus", () => {
  it("returns first empty target for incomplete zones", () => {
    const draft = createEmptyDragDropAssignments(["t1", "t2"]);
    draft.t1 = ["a"];
    const focus = getDragDropValidationFocus(baseContent, draft, DRAG_DROP_INCOMPLETE_ZONES_MESSAGE);
    expect(focus).toEqual({ kind: "target", targetId: "t2" });
  });

  it("returns bank focus when cards remain in bank", () => {
    const content: NormalizedDragDropContent = { ...baseContent, requireBankEmpty: true };
    const draft = createEmptyDragDropAssignments(["t1", "t2"]);
    draft.t1 = ["a"];
    const focus = getDragDropValidationFocus(content, draft, DRAG_DROP_BANK_NOT_EMPTY_MESSAGE);
    expect(focus).toEqual({ kind: "bank" });
  });
});
