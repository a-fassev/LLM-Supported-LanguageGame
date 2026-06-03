"use client";

import { forwardRef, useCallback } from "react";
import { DragDropTile } from "@/components/game/tasks/types/drag-drop/DragDropTile";
import { useReservedFlexHeight } from "@/components/game/tasks/types/drag-drop/use-reserved-flex-height";
import type { DragDropItemView } from "@/lib/game/tasks/drag-drop/drag-drop-types";
import { DRAG_DROP_SLOT_MIN_HEIGHT_CLASS, DRAG_DROP_ZONE_HINT } from "@/lib/game/tasks/drag-drop/drag-drop-types";
import { cn } from "@/lib/utils";
import { TASK_PLAY_META_TEXT } from "@/lib/game/task-typography";

type DragDropDropZoneProps = {
  sceneId: string;
  targetId: string;
  targetTitle?: string;
  placedItems: DragDropItemView[];
  selectedItemId: string | null;
  draggingItemId: string | null;
  zoneTabIndex: number;
  disabled?: boolean;
  onTargetActivate: () => void;
  onZoneKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onUnpairItem: (itemId: string) => void;
  onItemPointerDown: (itemId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onItemPointerUp: (itemId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onItemKeyDown: (itemId: string, event: React.KeyboardEvent<HTMLButtonElement>) => void;
};

function isUnpairControl(target: EventTarget | null): boolean {
  return Boolean(target && (target as HTMLElement).closest("[data-drag-drop-unpair]"));
}

function clickedTileItemId(target: EventTarget | null): string | null {
  const tile = target && (target as HTMLElement).closest("button[data-drag-drop-item-id]");
  return tile?.getAttribute("data-drag-drop-item-id") ?? null;
}

export const DragDropDropZone = forwardRef<HTMLDivElement, DragDropDropZoneProps>(function DragDropDropZone(
  {
    sceneId,
    targetId,
    targetTitle,
    placedItems,
    selectedItemId,
    draggingItemId,
    zoneTabIndex,
    disabled,
    onTargetActivate,
    onZoneKeyDown,
    onUnpairItem,
    onItemPointerDown,
    onItemPointerUp,
    onItemKeyDown,
  },
  ref,
) {
  const hasTiles = placedItems.length > 0;
  const { areaRef, reservedMinHeight } = useReservedFlexHeight(`${sceneId}:${targetId}`, hasTiles);
  const slotStyle =
    reservedMinHeight > 0 ? ({ minHeight: reservedMinHeight } as const) : undefined;

  const handleZoneClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !selectedItemId) return;
      if (isUnpairControl(event.target)) return;

      const clickedId = clickedTileItemId(event.target);
      if (clickedId && clickedId !== selectedItemId) return;

      onTargetActivate();
    },
    [disabled, onTargetActivate, selectedItemId],
  );

  const zoneLabel = targetTitle
    ? `Categoria: ${targetTitle}${selectedItemId ? ". Premi Invio per posizionare la carta selezionata." : ""}`
    : selectedItemId
      ? "Zona di destinazione. Premi Invio per posizionare la carta selezionata."
      : "Zona di destinazione";

  return (
    <div
      ref={ref}
      role="group"
      data-drag-drop-target-id={targetId}
      tabIndex={zoneTabIndex}
      aria-label={zoneLabel}
      onClick={handleZoneClick}
      onKeyDown={onZoneKeyDown}
      style={slotStyle}
      className={cn(
        "flex w-full flex-wrap items-start gap-2 rounded-md bg-muted/20 p-2 text-left transition-[color,background-color,min-height] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        DRAG_DROP_SLOT_MIN_HEIGHT_CLASS,
        !disabled && selectedItemId && "cursor-pointer hover:bg-muted/35",
        !disabled && !selectedItemId && hasTiles && "cursor-default",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {!hasTiles ? (
        <span
          className={cn(
            "pointer-events-none flex w-full items-center justify-start text-left italic",
            TASK_PLAY_META_TEXT,
            DRAG_DROP_SLOT_MIN_HEIGHT_CLASS,
          )}
        >
          {DRAG_DROP_ZONE_HINT}
        </span>
      ) : (
        <div ref={areaRef} className="flex w-full flex-wrap items-start gap-2">
          {placedItems.map((item) => (
            <DragDropTile
              key={item.id}
              itemId={item.id}
              label={item.label}
              selected={selectedItemId === item.id}
              showUnpair
              dimmed={draggingItemId === item.id}
              disabled={disabled}
              onPointerDown={(event) => onItemPointerDown(item.id, event)}
              onPointerUp={(event) => onItemPointerUp(item.id, event)}
              onKeyDown={(event) => onItemKeyDown(item.id, event)}
              onUnpair={() => onUnpairItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});
