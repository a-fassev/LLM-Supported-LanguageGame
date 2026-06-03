"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RunSceneDto } from "@/lib/api-client";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import {
  DragDropDragPreview,
  type DragDropDragPreviewState,
} from "@/components/game/tasks/types/drag-drop/DragDropDragPreview";
import { DragDropItemBank } from "@/components/game/tasks/types/drag-drop/DragDropItemBank";
import { DragDropTargetBlock } from "@/components/game/tasks/types/drag-drop/DragDropTargetBlock";
import { findDragDropTargetIdFromPoint } from "@/components/game/tasks/types/drag-drop/DragDropTile";
import { readTileGrabOffset } from "@/lib/game/tasks/drag-drop/read-tile-grab-offset";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { readTaskScenePrompt } from "@/lib/game/scene-display";
import {
  getBankItemIds,
  placeItemOnTarget,
  removeItemFromAssignments,
} from "@/lib/game/tasks/drag-drop/drag-drop-assignment-actions";
import { stableShuffleDragDropItems } from "@/lib/game/tasks/drag-drop/drag-drop-display-order";
import { getDragDropValidationFocus } from "@/lib/game/tasks/drag-drop/get-drag-drop-validation-focus";
import {
  DRAG_DROP_CONTENT_MISMATCH_MESSAGE,
  DRAG_DROP_DRAG_HINT,
  DRAG_DROP_DRAG_THRESHOLD_PX,
  type DragDropAssignmentsDraft,
  type DragDropAssignmentsUpdater,
  type DragDropItemView,
} from "@/lib/game/tasks/drag-drop/drag-drop-types";
import { normalizeDragDropContentResult } from "@/lib/game/tasks/drag-drop/normalize-drag-drop-content";

const TASK_BODY_SCROLL_SELECTOR = "[data-task-body-scroll]";

type DragDropTaskProps = {
  scene: RunSceneDto;
  assignments: DragDropAssignmentsDraft;
  validationError?: string | null;
  disabled?: boolean;
  onAssignmentsChange: (updater: DragDropAssignmentsUpdater) => void;
};

export function DragDropTask({
  scene,
  assignments,
  validationError,
  disabled,
  onAssignmentsChange,
}: DragDropTaskProps) {
  const normalizedResult = useMemo(() => normalizeDragDropContentResult(getTaskPayload(scene)), [scene]);
  const content = normalizedResult.ok ? normalizedResult.content : null;

  const itemById = useMemo(() => {
    const map = new Map<string, DragDropItemView>();
    for (const item of content?.items ?? []) {
      map.set(item.id, item);
    }
    return map;
  }, [content]);

  const targetIds = useMemo(() => content?.targets.map((t) => t.id) ?? [], [content]);
  const allItemIds = useMemo(() => content?.items.map((item) => item.id) ?? [], [content]);

  const bankItems = useMemo(() => {
    if (!content) return [];
    const bankIds = getBankItemIds(allItemIds, assignments);
    const order = content.shuffleItemOrder
      ? stableShuffleDragDropItems(content.items, `${scene.id}:bank`)
      : content.items;
    const bankSet = new Set(bankIds);
    return order.filter((item) => bankSet.has(item.id));
  }, [allItemIds, assignments, content, scene.id]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [keyboardZoneId, setKeyboardZoneId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  const zoneRefs = useRef(new Map<string, HTMLDivElement>());
  const gestureRef = useRef<{
    pointerId: number;
    itemId: string;
    label: string;
    startX: number;
    startY: number;
    grabOffsetX: number;
    grabOffsetY: number;
    grabWidth: number;
    grabHeight: number;
    showUnpair: boolean;
    dragging: boolean;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<DragDropDragPreviewState | null>(null);
  const lastValidationErrorRef = useRef<string | null>(null);

  const hintText = content?.subtitle?.trim() || DRAG_DROP_DRAG_HINT;

  const setZoneRef = useCallback((targetId: string, element: HTMLDivElement | null) => {
    if (element) zoneRefs.current.set(targetId, element);
    else zoneRefs.current.delete(targetId);
  }, []);

  const focusZone = useCallback((targetId: string) => {
    const zone = zoneRefs.current.get(targetId);
    if (!zone) return;
    const scrollParent = zone.closest(TASK_BODY_SCROLL_SELECTOR);
    zone.scrollIntoView({ block: "nearest", behavior: "smooth" });
    scrollParent?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    zone.focus();
    setKeyboardZoneId(targetId);
  }, []);

  const focusBank = useCallback(() => {
    const bank = bankRef.current;
    if (!bank) return;
    const firstTile = bank.querySelector<HTMLButtonElement>("button[data-drag-drop-item-id]");
    if (!firstTile) return;
    const scrollParent = bank.closest(TASK_BODY_SCROLL_SELECTOR);
    firstTile.scrollIntoView({ block: "nearest", behavior: "smooth" });
    scrollParent?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    firstTile.focus();
  }, []);

  useEffect(() => {
    if (!content || !validationError || validationError === lastValidationErrorRef.current) return;
    lastValidationErrorRef.current = validationError;

    const focus = getDragDropValidationFocus(content, assignments, validationError);
    if (!focus) return;

    if (focus.kind === "bank") {
      focusBank();
      return;
    }
    focusZone(focus.targetId);
  }, [assignments, content, focusBank, focusZone, validationError]);

  useEffect(() => {
    if (validationError === null) {
      lastValidationErrorRef.current = null;
    }
  }, [validationError]);

  const placeItem = useCallback(
    (itemId: string, targetId: string) => {
      if (!content) return;
      const target = content.targets.find((t) => t.id === targetId);
      if (!target) return;
      onAssignmentsChange((prev) => placeItemOnTarget(prev, itemId, targetId, target, targetIds));
      setSelectedItemId(null);
      setKeyboardZoneId(null);
    },
    [content, onAssignmentsChange, targetIds],
  );

  const returnItemToBank = useCallback(
    (itemId: string) => {
      onAssignmentsChange((prev) => removeItemFromAssignments(prev, itemId, targetIds));
      setSelectedItemId((current) => (current === itemId ? null : current));
    },
    [onAssignmentsChange, targetIds],
  );

  const placeItemRef = useRef(placeItem);
  const returnItemToBankRef = useRef(returnItemToBank);

  useEffect(() => {
    placeItemRef.current = placeItem;
    returnItemToBankRef.current = returnItemToBank;
  }, [placeItem, returnItemToBank]);

  const endFloatDrag = useCallback(() => {
    setDragPreview(null);
    gestureRef.current = null;
  }, []);

  const finishDragAt = useCallback(
    (itemId: string, clientX: number, clientY: number) => {
      const targetId = findDragDropTargetIdFromPoint(clientX, clientY);
      if (targetId) {
        placeItemRef.current(itemId, targetId);
      } else {
        returnItemToBankRef.current(itemId);
      }
      endFloatDrag();
    },
    [endFloatDrag],
  );

  const handleTargetActivate = useCallback(
    (targetId: string) => {
      if (disabled || !selectedItemId) return;
      placeItem(selectedItemId, targetId);
    },
    [disabled, placeItem, selectedItemId],
  );

  const toggleItemSelection = useCallback(
    (itemId: string) => {
      setSelectedItemId((current) => {
        if (current === itemId) {
          setKeyboardZoneId(null);
          return null;
        }
        setKeyboardZoneId(content?.targets[0]?.id ?? null);
        return itemId;
      });
    },
    [content],
  );

  const handleItemKeyDown = useCallback(
    (itemId: string, event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleItemSelection(itemId);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedItemId(null);
        setKeyboardZoneId(null);
        gestureRef.current = null;
        endFloatDrag();
      }
    },
    [disabled, endFloatDrag, toggleItemSelection],
  );

  const handleZoneKeyDown = useCallback(
    (targetId: string, event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled || !content) return;

      if (selectedItemId && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        handleTargetActivate(targetId);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const index = content.targets.findIndex((target) => target.id === targetId);
        if (index < 0) return;
        const nextIndex = event.key === "ArrowDown" ? index + 1 : index - 1;
        const nextTarget = content.targets[nextIndex];
        if (!nextTarget) return;
        focusZone(nextTarget.id);
      }
    },
    [content, disabled, focusZone, handleTargetActivate, selectedItemId],
  );

  const handleItemPointerDown = useCallback(
    (itemId: string, event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled || event.button !== 0) return;
      const label = itemById.get(itemId)?.label;
      if (!label) return;
      const grab = readTileGrabOffset(event);
      const showUnpair = Boolean(event.currentTarget.closest("[data-drag-drop-target-id]"));
      gestureRef.current = {
        pointerId: event.pointerId,
        itemId,
        label,
        startX: event.clientX,
        startY: event.clientY,
        grabOffsetX: grab.offsetX,
        grabOffsetY: grab.offsetY,
        grabWidth: grab.width,
        grabHeight: grab.height,
        showUnpair,
        dragging: false,
      };
    },
    [disabled, itemById],
  );

  const handleItemPointerUp = useCallback(
    (itemId: string, event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const gesture = gestureRef.current;
      if (!gesture || gesture.itemId !== itemId || gesture.pointerId !== event.pointerId) return;

      if (gesture.dragging) {
        finishDragAt(itemId, event.clientX, event.clientY);
        return;
      }

      const moved = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
      if (moved < DRAG_DROP_DRAG_THRESHOLD_PX) {
        toggleItemSelection(itemId);
      }
      gestureRef.current = null;
    },
    [disabled, finishDragAt, toggleItemSelection],
  );

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;

      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      const distance = Math.hypot(dx, dy);

      if (!gesture.dragging && distance >= DRAG_DROP_DRAG_THRESHOLD_PX) {
        gesture.dragging = true;
        setDragPreview({
          itemId: gesture.itemId,
          label: gesture.label,
          clientX: event.clientX,
          clientY: event.clientY,
          offsetX: gesture.grabOffsetX,
          offsetY: gesture.grabOffsetY,
          width: gesture.grabWidth,
          height: gesture.grabHeight,
          showUnpair: gesture.showUnpair,
        });
        setSelectedItemId(null);
        setKeyboardZoneId(null);
      }

      if (gesture.dragging) {
        setDragPreview((current) =>
          current
            ? { ...current, clientX: event.clientX, clientY: event.clientY }
            : current,
        );
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId || !gesture.dragging) return;
      finishDragAt(gesture.itemId, event.clientX, event.clientY);
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
    };
  }, [finishDragAt, itemById]);

  useEffect(() => {
    if (!dragPreview) return;
    const previous = document.body.style.cursor;
    document.body.style.cursor = "grabbing";
    return () => {
      document.body.style.cursor = previous;
    };
  }, [dragPreview]);

  if (!content) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {validationError ?? DRAG_DROP_CONTENT_MISMATCH_MESSAGE}
      </p>
    );
  }

  const prompt = readTaskScenePrompt(scene) ?? content.prompt;
  const activeKeyboardZoneId = selectedItemId
    ? (keyboardZoneId ?? content.targets[0]?.id ?? null)
    : null;
  const draggingItemId = dragPreview?.itemId ?? null;

  return (
    <TaskBodyLayout
      prompt={prompt}
      beforeScroll={
        <div className="shrink-0 space-y-2">
          {validationError ? (
            <p className="text-sm text-destructive" role="alert">
              {validationError}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">{hintText}</p>
          <DragDropItemBank
            ref={bankRef}
            sceneId={scene.id}
            caption={content.sourceLabel}
            items={bankItems}
            selectedItemId={selectedItemId}
            draggingItemId={draggingItemId}
            disabled={disabled}
            onItemPointerDown={handleItemPointerDown}
            onItemPointerUp={handleItemPointerUp}
            onItemKeyDown={handleItemKeyDown}
          />
        </div>
      }
    >
      <div ref={rootRef} className={dragPreview ? "relative min-h-0 cursor-grabbing" : "relative min-h-0"}>
        <div>
          <p className="mb-1.5 shrink-0 text-xs font-bold text-foreground">{content.targetLabel}</p>
          {content.targets.map((target) => {
            const placedIds = assignments[target.id] ?? [];
            const placedItems = placedIds
              .map((id) => itemById.get(id))
              .filter((item): item is DragDropItemView => Boolean(item));

            const zoneTabIndex = !disabled && activeKeyboardZoneId === target.id ? 0 : -1;

            return (
              <DragDropTargetBlock
                key={target.id}
                sceneId={scene.id}
                target={target}
                placedItems={placedItems}
                selectedItemId={selectedItemId}
                draggingItemId={draggingItemId}
                zoneTabIndex={zoneTabIndex}
                disabled={disabled}
                zoneRef={(element) => setZoneRef(target.id, element)}
                onTargetActivate={handleTargetActivate}
                onZoneKeyDown={handleZoneKeyDown}
                onUnpairItem={returnItemToBank}
                onItemPointerDown={handleItemPointerDown}
                onItemPointerUp={handleItemPointerUp}
                onItemKeyDown={handleItemKeyDown}
              />
            );
          })}
        </div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {dragPreview ? `Trascinando: ${dragPreview.label}` : null}
        </div>

        {dragPreview ? <DragDropDragPreview preview={dragPreview} /> : null}
      </div>
    </TaskBodyLayout>
  );
}
