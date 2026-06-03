"use client";

import { createPortal } from "react-dom";
import { DragDropTile } from "@/components/game/tasks/types/drag-drop/DragDropTile";

export type DragDropDragPreviewState = {
  itemId: string;
  label: string;
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  showUnpair: boolean;
};

type DragDropDragPreviewProps = {
  preview: DragDropDragPreviewState;
};

/** Rendered on `document.body` so `position: fixed` tracks the pointer (no ancestor transform). */
export function DragDropDragPreview({ preview }: DragDropDragPreviewProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[100] shadow-md"
      style={{
        left: preview.clientX - preview.offsetX,
        top: preview.clientY - preview.offsetY,
        width: preview.width,
        height: preview.height,
      }}
      aria-hidden
    >
      <DragDropTile
        itemId={preview.itemId}
        label={preview.label}
        showUnpair={preview.showUnpair}
        disabled
      />
    </div>,
    document.body,
  );
}
