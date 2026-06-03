import { getBankItemIds } from "@/lib/game/tasks/drag-drop/drag-drop-assignment-actions";
import {
  DRAG_DROP_BANK_NOT_EMPTY_MESSAGE,
  DRAG_DROP_INCOMPLETE_ZONES_MESSAGE,
  type DragDropAssignmentsDraft,
  type NormalizedDragDropContent,
} from "@/lib/game/tasks/drag-drop/drag-drop-types";

export type DragDropValidationFocus =
  | { kind: "target"; targetId: string }
  | { kind: "bank" };

export function getDragDropValidationFocus(
  content: NormalizedDragDropContent,
  assignments: DragDropAssignmentsDraft,
  validationError: string | null,
): DragDropValidationFocus | null {
  if (!validationError) return null;

  if (validationError === DRAG_DROP_INCOMPLETE_ZONES_MESSAGE) {
    for (const target of content.targets) {
      if ((assignments[target.id] ?? []).length === 0) {
        return { kind: "target", targetId: target.id };
      }
    }
    return null;
  }

  if (validationError === DRAG_DROP_BANK_NOT_EMPTY_MESSAGE) {
    const bankIds = getBankItemIds(
      content.items.map((item) => item.id),
      assignments,
    );
    if (bankIds.length > 0) return { kind: "bank" };
  }

  return null;
}
