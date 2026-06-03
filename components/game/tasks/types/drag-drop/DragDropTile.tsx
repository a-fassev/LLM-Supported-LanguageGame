"use client";

import { DRAG_DROP_SLOT_MIN_HEIGHT_CLASS } from "@/lib/game/tasks/drag-drop/drag-drop-types";
import { cn } from "@/lib/utils";
import { TASK_PLAY_BODY_TEXT } from "@/lib/game/task-typography";

type DragDropTileProps = {
  itemId: string;
  label: string;
  selected?: boolean;
  showUnpair?: boolean;
  dimmed?: boolean;
  disabled?: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onUnpair?: () => void;
};

export function DragDropTile({
  itemId,
  label,
  selected = false,
  showUnpair = false,
  dimmed = false,
  disabled = false,
  onPointerDown,
  onPointerUp,
  onKeyDown,
  onUnpair,
}: DragDropTileProps) {
  return (
    <div className="relative inline-flex h-full max-w-full">
      <button
        type="button"
        data-drag-drop-item-id={itemId}
        disabled={disabled}
        aria-pressed={selected}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        className={cn(
          "box-border inline-flex h-full min-w-20 w-full max-w-full items-center justify-center rounded-md border bg-background/90 px-3 py-2 transition-[color,opacity,box-shadow]",
          TASK_PLAY_BODY_TEXT,
          DRAG_DROP_SLOT_MIN_HEIGHT_CLASS,
          showUnpair && "pr-9",
          "cursor-grab hover:bg-accent/40 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-60",
          selected && "border-primary ring-2 ring-primary/30",
          !selected && "border-border",
          dimmed && "opacity-30",
        )}
      >
        {label}
      </button>
      {showUnpair ? (
        <button
          type="button"
          data-drag-drop-unpair
          aria-label="Rimuovi dalla casella"
          title="Rimuovi dalla casella"
          disabled={disabled}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onUnpair?.();
          }}
          className="absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-lg leading-none text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

function findDragDropTargetIdFromPoint(x: number, y: number): string | null {
  const element = document.elementFromPoint(x, y);
  let current: Element | null = element;
  while (current) {
    const targetId = current.getAttribute("data-drag-drop-target-id");
    if (targetId) return targetId;
    current = current.parentElement;
  }
  return null;
}

export { findDragDropTargetIdFromPoint };
