import { parseDragDropClientContent } from "@/lib/game/schemas/dragDropContentSchema";
import { sanitizeTaskPayloadForClient } from "@/lib/game/content/sanitize-task-payload-for-client";
import {
  DEFAULT_DRAG_DROP_SOURCE_LABEL,
  DEFAULT_DRAG_DROP_TARGET_LABEL,
  DRAG_DROP_CONTENT_MISMATCH_MESSAGE,
  type DragDropItemView,
  type DragDropTargetView,
  type NormalizedDragDropContent,
} from "@/lib/game/tasks/drag-drop/drag-drop-types";

export { DRAG_DROP_CONTENT_MISMATCH_MESSAGE };

export type NormalizeDragDropResult =
  | { ok: true; content: NormalizedDragDropContent }
  | { ok: false; message: string };

function mapItem(item: { id: string; label?: string }): DragDropItemView {
  const label = item.label?.trim();
  if (!label) throw new Error(`item '${item.id}' missing label`);
  return { id: item.id.trim(), label };
}

function mapTarget(target: { id: string; title?: string; matchMode?: "one" | "all" }): DragDropTargetView {
  return {
    id: target.id.trim(),
    title: target.title?.trim() || undefined,
    matchMode: target.matchMode === "all" ? "all" : "one",
  };
}

export function normalizeDragDropContentResult(taskPayload: Record<string, unknown>): NormalizeDragDropResult {
  const sanitized = sanitizeTaskPayloadForClient("drag_drop", taskPayload);
  const parsed = parseDragDropClientContent(sanitized);
  if (!parsed.ok) {
    return { ok: false, message: parsed.issues };
  }

  try {
    const value = parsed.value;
    const presentation = value.presentation;
    const content: NormalizedDragDropContent = {
      prompt: value.prompt?.trim() || undefined,
      subtitle: value.subtitle?.trim() || undefined,
      items: value.items.map(mapItem),
      targets: value.targets.map(mapTarget),
      sourceLabel: presentation?.sourceLabel?.trim() || DEFAULT_DRAG_DROP_SOURCE_LABEL,
      targetLabel: presentation?.targetLabel?.trim() || DEFAULT_DRAG_DROP_TARGET_LABEL,
      shuffleItemOrder: value.shuffleItemOrder !== false,
      requireBankEmpty: value.requireBankEmpty === true,
    };
    if (content.items.length === 0 || content.targets.length === 0) {
      return { ok: false, message: "drag_drop has no items or targets" };
    }
    return { ok: true, content };
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid drag_drop content";
    return { ok: false, message };
  }
}
