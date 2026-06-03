import type { DragDropAssignmentsDraft, DragDropTargetView } from "@/lib/game/tasks/drag-drop/drag-drop-types";

function cloneAssignments(assignments: DragDropAssignmentsDraft, targetIds: string[]): DragDropAssignmentsDraft {
  const next: DragDropAssignmentsDraft = {};
  for (const targetId of targetIds) {
    next[targetId] = [...(assignments[targetId] ?? [])];
  }
  return next;
}

export function createEmptyDragDropAssignments(targetIds: string[]): DragDropAssignmentsDraft {
  const draft: DragDropAssignmentsDraft = {};
  for (const targetId of targetIds) {
    draft[targetId] = [];
  }
  return draft;
}

export function getPlacedItemIds(assignments: DragDropAssignmentsDraft): Set<string> {
  const placed = new Set<string>();
  for (const ids of Object.values(assignments)) {
    for (const id of ids) placed.add(id);
  }
  return placed;
}

export function getBankItemIds(allItemIds: string[], assignments: DragDropAssignmentsDraft): string[] {
  const placed = getPlacedItemIds(assignments);
  return allItemIds.filter((id) => !placed.has(id));
}

export function removeItemFromAssignments(
  assignments: DragDropAssignmentsDraft,
  itemId: string,
  targetIds: string[],
): DragDropAssignmentsDraft {
  const next = cloneAssignments(assignments, targetIds);
  for (const targetId of targetIds) {
    next[targetId] = next[targetId].filter((id) => id !== itemId);
  }
  return next;
}

export function placeItemOnTarget(
  assignments: DragDropAssignmentsDraft,
  itemId: string,
  targetId: string,
  target: DragDropTargetView,
  targetIds: string[],
): DragDropAssignmentsDraft {
  const next = removeItemFromAssignments(assignments, itemId, targetIds);

  if (target.matchMode === "one") {
    for (const tid of targetIds) {
      if (tid !== targetId) {
        next[tid] = next[tid].filter((id) => id !== itemId);
      }
    }
    if (!next[targetId].includes(itemId)) {
      next[targetId] = [...next[targetId], itemId];
    }
    return next;
  }

  if (!next[targetId].includes(itemId)) {
    next[targetId] = [...next[targetId], itemId];
  }
  return next;
}
