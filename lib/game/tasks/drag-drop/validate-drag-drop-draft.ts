import type { DragDropAssignmentsDraft, NormalizedDragDropContent } from "@/lib/game/tasks/drag-drop/drag-drop-types";

export type ValidateDragDropDraftResult =
  | { ok: true }
  | { ok: false; message: string; focusTargetId?: string; focusBank?: boolean };

/** Drag-drop submits any partial layout; scoring runs server-side on Controlla. */
export function validateDragDropDraft(
  _content: NormalizedDragDropContent,
  _assignments: DragDropAssignmentsDraft,
): ValidateDragDropDraftResult {
  return { ok: true };
}
