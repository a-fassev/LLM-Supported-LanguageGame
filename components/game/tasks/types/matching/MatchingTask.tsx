"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RunSceneDto } from "@/lib/api-client";
import { TaskBodyLayout } from "@/components/game/tasks/TaskBodyLayout";
import { MatchingColumn } from "@/components/game/tasks/types/matching/MatchingColumn";
import {
  MatchingLineLayer,
  type MatchingLineLayerHandle,
} from "@/components/game/tasks/types/matching/MatchingLineLayer";
import { getTaskPayload } from "@/lib/game/get-task-payload";
import { buildMatchingDisplayOrder } from "@/lib/game/tasks/matching/matching-display-order";
import { applyMatchingPair, clearMatchingPair } from "@/lib/game/tasks/matching/matching-pair-actions";
import {
  MATCHING_CONTENT_MISMATCH_MESSAGE,
  MATCHING_DRAG_HINT,
  MATCHING_DRAG_THRESHOLD_PX,
} from "@/lib/game/tasks/matching/matching-types";
import { normalizeMatchingContentResult } from "@/lib/game/tasks/matching/normalize-matching-content";
import { TASK_PLAY_ERROR_TEXT, TASK_PLAY_META_TEXT, TASK_PLAY_VALIDATION_ERROR_TEXT } from "@/lib/game/task-typography";
import type { MatchingPairsDraft, MatchingPairsUpdater } from "@/lib/game/tasks/matching/matching-types";

const TASK_BODY_SCROLL_SELECTOR = "[data-task-body-scroll]";

type MatchingTaskProps = {
  scene: RunSceneDto;
  pairs: MatchingPairsDraft;
  validationError?: string | null;
  disabled?: boolean;
  onPairsChange: (updater: MatchingPairsUpdater) => void;
};

function findMatchingCardIdFromPoint(x: number, y: number, side: "left" | "right"): string | null {
  const element = document.elementFromPoint(x, y);
  let current: Element | null = element;
  while (current) {
    const cardSide = current.getAttribute("data-matching-side");
    const cardId = current.getAttribute("data-matching-card-id");
    if (cardSide === side && cardId) return cardId;
    current = current.parentElement;
  }
  return null;
}

export function MatchingTask({
  scene,
  pairs,
  validationError,
  disabled,
  onPairsChange,
}: MatchingTaskProps) {
  const normalizedResult = useMemo(() => normalizeMatchingContentResult(getTaskPayload(scene)), [scene]);
  const content = normalizedResult.ok ? normalizedResult.content : null;

  const displayOrder = useMemo(() => {
    if (!content) return null;
    return buildMatchingDisplayOrder(content, scene.id);
  }, [content, scene.id]);

  const leftIds = useMemo(() => displayOrder?.leftItems.map((item) => item.id) ?? [], [displayOrder]);

  const pairingAreaRef = useRef<HTMLDivElement>(null);
  const lineLayerRef = useRef<MatchingLineLayerHandle>(null);
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [geometryVersion, setGeometryVersion] = useState(0);

  const gestureRef = useRef<{
    pointerId: number;
    leftId: string;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);
  const rubberRafRef = useRef<number | null>(null);
  const pendingRubberRef = useRef<{ leftId: string; pointerX: number; pointerY: number } | null>(null);
  const geometryBumpScheduledRef = useRef(false);

  const bumpGeometry = useCallback(() => {
    setGeometryVersion((value) => value + 1);
  }, []);

  const scheduleGeometryBump = useCallback(() => {
    if (geometryBumpScheduledRef.current) return;
    geometryBumpScheduledRef.current = true;
    requestAnimationFrame(() => {
      geometryBumpScheduledRef.current = false;
      bumpGeometry();
    });
  }, [bumpGeometry]);

  const registerRef = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) {
        cardRefs.current.set(id, node);
      } else {
        cardRefs.current.delete(id);
      }
      scheduleGeometryBump();
    },
    [scheduleGeometryBump],
  );

  const getLeftElement = useCallback((leftId: string) => cardRefs.current.get(leftId) ?? null, []);
  const getRightElement = useCallback((rightId: string) => cardRefs.current.get(rightId) ?? null, []);

  useEffect(() => {
    const area = pairingAreaRef.current;
    if (!area) return;

    const scrollParent = area.closest(TASK_BODY_SCROLL_SELECTOR);
    const resizeObserver = new ResizeObserver(() => bumpGeometry());
    resizeObserver.observe(area);

    const onScroll = () => bumpGeometry();
    scrollParent?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      scrollParent?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [bumpGeometry, scene.id]);

  useEffect(() => {
    return () => {
      if (rubberRafRef.current != null) {
        cancelAnimationFrame(rubberRafRef.current);
      }
    };
  }, []);

  const pairedRightIds = useMemo(() => {
    const ids = new Set<string>();
    for (const rightId of Object.values(pairs)) {
      if (rightId) ids.add(rightId);
    }
    return ids;
  }, [pairs]);

  function scheduleRubberBand(leftId: string, pointerX: number, pointerY: number) {
    pendingRubberRef.current = { leftId, pointerX, pointerY };
    if (rubberRafRef.current != null) return;
    rubberRafRef.current = requestAnimationFrame(() => {
      rubberRafRef.current = null;
      const pending = pendingRubberRef.current;
      if (!pending) return;
      lineLayerRef.current?.setRubberBand(pending.leftId, pending.pointerX, pending.pointerY);
    });
  }

  function clearRubberBand() {
    pendingRubberRef.current = null;
    if (rubberRafRef.current != null) {
      cancelAnimationFrame(rubberRafRef.current);
      rubberRafRef.current = null;
    }
    lineLayerRef.current?.clearRubberBand();
  }

  function commitPair(leftId: string, rightId: string) {
    onPairsChange((prev) => applyMatchingPair(prev, leftId, rightId, leftIds));
    setSelectedLeftId(null);
    bumpGeometry();
  }

  function endGesture(event: React.PointerEvent, commitRightId?: string | null) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (gesture.dragging) {
      const rightId = commitRightId ?? findMatchingCardIdFromPoint(event.clientX, event.clientY, "right");
      if (rightId) {
        commitPair(gesture.leftId, rightId);
      }
    }

    if (pairingAreaRef.current?.hasPointerCapture(event.pointerId)) {
      pairingAreaRef.current.releasePointerCapture(event.pointerId);
    }
    gestureRef.current = null;
    clearRubberBand();
  }

  function handleLeftPointerDown(leftId: string, event: React.PointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    event.stopPropagation();
    gestureRef.current = {
      pointerId: event.pointerId,
      leftId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
  }

  function handleLeftPointerUp(leftId: string, event: React.PointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || gesture.leftId !== leftId) return;
    event.stopPropagation();

    if (gesture.dragging) {
      endGesture(event);
      return;
    }

    const moved = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (moved < MATCHING_DRAG_THRESHOLD_PX) {
      setSelectedLeftId((current) => (current === leftId ? null : leftId));
    }

    gestureRef.current = null;
    clearRubberBand();
  }

  function handleRightPointerUp(rightId: string, event: React.PointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    event.stopPropagation();

    const gesture = gestureRef.current;
    if (gesture?.dragging && gesture.pointerId === event.pointerId) {
      endGesture(event, rightId);
      return;
    }

    if (selectedLeftId) {
      commitPair(selectedLeftId, rightId);
    }
  }

  function handlePairingPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || disabled) return;

    const moved = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (!gesture.dragging && moved >= MATCHING_DRAG_THRESHOLD_PX) {
      gesture.dragging = true;
      pairingAreaRef.current?.setPointerCapture(event.pointerId);
      setSelectedLeftId(gesture.leftId);
    }

    if (gesture.dragging) {
      scheduleRubberBand(gesture.leftId, event.clientX, event.clientY);
    }
  }

  function handlePairingPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!gestureRef.current || gestureRef.current.pointerId !== event.pointerId || disabled) return;
    endGesture(event);
  }

  function handleLeftKeyDown(leftId: string, event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedLeftId((current) => (current === leftId ? null : leftId));
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setSelectedLeftId(null);
      gestureRef.current = null;
      clearRubberBand();
    }
  }

  function handleRightKeyDown(rightId: string, event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled || !selectedLeftId) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commitPair(selectedLeftId, rightId);
    }
  }

  if (!normalizedResult.ok || !content || !displayOrder) {
    return (
      <p className={TASK_PLAY_ERROR_TEXT} role="alert">
        {MATCHING_CONTENT_MISMATCH_MESSAGE}
      </p>
    );
  }

  const beforeScroll = (
    <>
      <p className={TASK_PLAY_META_TEXT}>{MATCHING_DRAG_HINT}</p>
      {validationError ? (
        <p className={TASK_PLAY_VALIDATION_ERROR_TEXT} role="alert">
          {validationError}
        </p>
      ) : null}
    </>
  );

  return (
    <TaskBodyLayout prompt={content.prompt} beforeScroll={beforeScroll}>
      <div
        ref={pairingAreaRef}
        className="relative min-h-[12rem] touch-pan-y"
        onPointerMove={handlePairingPointerMove}
        onPointerUp={handlePairingPointerUp}
        onPointerCancel={handlePairingPointerUp}
      >
        <MatchingLineLayer
          ref={lineLayerRef}
          areaRef={pairingAreaRef}
          getLeftElement={getLeftElement}
          getRightElement={getRightElement}
          pairs={pairs}
          geometryVersion={geometryVersion}
        />

        <div className="relative z-10 grid grid-cols-1 gap-12 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-24">
          <MatchingColumn
            header={content.leftLabel}
            side="left"
            items={displayOrder.leftItems}
            disabled={disabled}
            selectedLeftId={selectedLeftId}
            pairedRightIds={pairedRightIds}
            pairs={pairs}
            registerRef={registerRef}
            onLeftPointerDown={handleLeftPointerDown}
            onLeftPointerUp={handleLeftPointerUp}
            onUnpair={(leftId) => {
              onPairsChange((prev) => clearMatchingPair(prev, leftId));
              bumpGeometry();
            }}
            onLeftKeyDown={handleLeftKeyDown}
          />
          <MatchingColumn
            header={content.rightLabel}
            side="right"
            items={displayOrder.rightItems}
            disabled={disabled}
            pairedRightIds={pairedRightIds}
            pairs={pairs}
            registerRef={registerRef}
            onRightPointerUp={handleRightPointerUp}
            onRightKeyDown={handleRightKeyDown}
          />
        </div>
      </div>
    </TaskBodyLayout>
  );
}
