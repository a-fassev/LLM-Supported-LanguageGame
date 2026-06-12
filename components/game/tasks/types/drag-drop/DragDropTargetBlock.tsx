"use client";

import { DragDropDropZone } from "@/components/game/tasks/types/drag-drop/DragDropDropZone";
import { cn } from "@/lib/utils";
import {
  TASK_REVIEW_CORRECT,
  TASK_REVIEW_HINT_TEXT,
  TASK_REVIEW_INCORRECT,
} from "@/lib/game/task-review-styles";
import { TASK_PLAY_SECTION_LABEL_TEXT } from "@/lib/game/task-typography";
import type { DragDropItemView, DragDropTargetView } from "@/lib/game/tasks/drag-drop/drag-drop-types";

type DragDropTargetBlockProps = {
  sceneId: string;
  target: DragDropTargetView;
  placedItems: DragDropItemView[];
  selectedItemId: string | null;
  draggingItemId: string | null;
  zoneTabIndex: number;
  disabled?: boolean;
  reviewMode?: boolean;
  reviewIsCorrect?: boolean;
  reviewCorrectLabels?: string[];
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
  reviewMode,
  reviewIsCorrect,
  reviewCorrectLabels,
  zoneRef,
  onTargetActivate,
  onZoneKeyDown,
  onUnpairItem,
  onItemPointerDown,
  onItemPointerUp,
  onItemKeyDown,
}: DragDropTargetBlockProps) {
  return (
    <div>
      {target.title ? (
        <p className={cn("mb-1.5", TASK_PLAY_SECTION_LABEL_TEXT)}>{target.title}</p>
      ) : null}
      <div
        className={cn(
          reviewMode && reviewIsCorrect === true && `rounded-md ${TASK_REVIEW_CORRECT}`,
          reviewMode && reviewIsCorrect === false && `rounded-md ${TASK_REVIEW_INCORRECT}`,
        )}
      >
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
      {reviewMode && reviewIsCorrect === false && reviewCorrectLabels && reviewCorrectLabels.length > 0 ? (
        <p className={cn("mt-1", TASK_REVIEW_HINT_TEXT)}>
          Corretto: {reviewCorrectLabels.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
