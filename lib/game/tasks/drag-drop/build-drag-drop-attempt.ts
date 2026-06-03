import type { DragDropTargetView } from "@/lib/game/tasks/drag-drop/drag-drop-types";
import type { DragDropAssignmentsDraft } from "@/lib/game/tasks/drag-drop/drag-drop-types";

export type DragDropAttemptPayload = {
  taskType: "DragDrop";
  dragDrop: {
    assignments: Record<string, string | string[]>;
  };
};

export function buildDragDropAttempt(
  targets: readonly DragDropTargetView[],
  assignments: DragDropAssignmentsDraft,
): DragDropAttemptPayload {
  const payload: Record<string, string | string[]> = {};

  for (const target of targets) {
    const ids = [...(assignments[target.id] ?? [])].map((id) => id.trim()).filter(Boolean);
    if (target.matchMode === "all") {
      payload[target.id] = [...ids].sort();
    } else if (ids.length === 1) {
      payload[target.id] = ids[0];
    } else if (ids.length > 1) {
      payload[target.id] = ids;
    } else {
      payload[target.id] = "";
    }
  }

  return {
    taskType: "DragDrop",
    dragDrop: { assignments: payload },
  };
}
