"use client";

import { forwardRef } from "react";
import { DragDropTile } from "@/components/game/tasks/types/drag-drop/DragDropTile";
import { useReservedFlexHeight } from "@/components/game/tasks/types/drag-drop/use-reserved-flex-height";
import type { DragDropItemView } from "@/lib/game/tasks/drag-drop/drag-drop-types";
import { DRAG_DROP_SLOT_MIN_HEIGHT_CLASS } from "@/lib/game/tasks/drag-drop/drag-drop-types";
import { cn } from "@/lib/utils";

type DragDropItemBankProps = {
  sceneId: string;
  caption: string;
  items: DragDropItemView[];
  selectedItemId: string | null;
  draggingItemId: string | null;
  disabled?: boolean;
  onItemPointerDown: (itemId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onItemPointerUp: (itemId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onItemKeyDown: (itemId: string, event: React.KeyboardEvent<HTMLButtonElement>) => void;
};

export const DragDropItemBank = forwardRef<HTMLDivElement, DragDropItemBankProps>(function DragDropItemBank(
  { sceneId, caption, items, selectedItemId, draggingItemId, disabled, onItemPointerDown, onItemPointerUp, onItemKeyDown },
  ref,
) {
  const hasItems = items.length > 0;
  const { areaRef, reservedMinHeight } = useReservedFlexHeight(sceneId, hasItems);

  const slotStyle =
    reservedMinHeight > 0 ? ({ minHeight: reservedMinHeight } as const) : undefined;

  return (
    <div ref={ref} className="shrink-0">
      <p className="mb-1.5 text-xs font-bold text-foreground">{caption}</p>
      {hasItems ? (
        <div ref={areaRef} className="flex flex-wrap items-start justify-start gap-2" style={slotStyle}>
          {items.map((item) => (
            <DragDropTile
              key={item.id}
              itemId={item.id}
              label={item.label}
              selected={selectedItemId === item.id}
              dimmed={draggingItemId === item.id}
              disabled={disabled}
              onPointerDown={(event) => onItemPointerDown(item.id, event)}
              onPointerUp={(event) => onItemPointerUp(item.id, event)}
              onKeyDown={(event) => onItemKeyDown(item.id, event)}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "flex w-full items-center justify-start rounded-md bg-muted/10 p-2",
            DRAG_DROP_SLOT_MIN_HEIGHT_CLASS,
          )}
          style={slotStyle}
        >
          <p className="w-full text-left text-xs italic text-muted-foreground">
            Tutte le carte sono posizionate.
          </p>
        </div>
      )}
    </div>
  );
});
