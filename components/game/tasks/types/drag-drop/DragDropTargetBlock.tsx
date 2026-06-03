"use client";

import { DragDropDropZone } from "@/components/game/tasks/types/drag-drop/DragDropDropZone";
import type { DragDropItemView, DragDropTargetView } from "@/lib/game/tasks/drag-drop/drag-drop-types";

type DragDropTargetBlockProps = {
  sceneId: string;
  target: DragDropTargetView;
  placedItems: DragDropItemView[];
  selectedItemId: string | null;
  draggingItemId: string | null;
  zoneTabIndex: number;
  disabled?: boolean;
  zoneRef: (element: HTMLDivElement | null) => void;
  onTargetActivate: (targetId: string) => void;
  onZoneKeyDown: (targetId: string, event: React.KeyboardEvent<HTMLDivElement>) => void;
  onUnpairItem: (itemId: string) => void;
  onItemPointerDown: (itemId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onItemPointerUp: (itemId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onItemKeyDown: (itemId: string, event: React.KeyboardEvent<HTMLButtonElement>) => void;
};

export function DragDropTargetBlock({
  sceneId,
  target,
  placedItems,
  selectedItemId,
  draggingItemId,
  zoneTabIndex,
  disabled,
  zoneRef,
  onTargetActivate,
  onZoneKeyDown,
  onUnpairItem,
  onItemPointerDown,
  onItemPointerUp,
  onItemKeyDown,
}: DragDropTargetBlockProps) {
  return (
    <div className="mb-2.5">
      {target.title ? (
        <p className="mb-1.5 text-sm font-semibold text-foreground">{target.title}</p>
      ) : null}
      <DragDropDropZone
        ref={zoneRef}
        sceneId={sceneId}
        targetId={target.id}
        targetTitle={target.title}
        placedItems={placedItems}
        selectedItemId={selectedItemId}
        draggingItemId={draggingItemId}
        zoneTabIndex={zoneTabIndex}
        disabled={disabled}
        onTargetActivate={() => onTargetActivate(target.id)}
        onZoneKeyDown={(event) => onZoneKeyDown(target.id, event)}
        onUnpairItem={onUnpairItem}
        onItemPointerDown={onItemPointerDown}
        onItemPointerUp={onItemPointerUp}
        onItemKeyDown={onItemKeyDown}
      />
    </div>
  );
}
