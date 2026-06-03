"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import {
  rectFromDomRect,
  rubberBandSegment,
  segmentBetweenElements,
} from "@/lib/game/tasks/matching/matching-line-geometry";
import type { MatchingLineSegment } from "@/lib/game/tasks/matching/matching-types";

export type MatchingLineLayerHandle = {
  setRubberBand: (leftId: string, pointerX: number, pointerY: number) => void;
  clearRubberBand: () => void;
};

type MatchingLineLayerProps = {
  areaRef: React.RefObject<HTMLElement | null>;
  getLeftElement: (leftId: string) => HTMLElement | null;
  getRightElement: (rightId: string) => HTMLElement | null;
  pairs: Record<string, string | null>;
  geometryVersion: number;
};

export const MatchingLineLayer = forwardRef<MatchingLineLayerHandle, MatchingLineLayerProps>(
  function MatchingLineLayer(
    { areaRef, getLeftElement, getRightElement, pairs, geometryVersion },
    ref,
  ) {
    const [segments, setSegments] = useState<Array<MatchingLineSegment & { key: string }>>([]);
    const rubberLineRef = useRef<SVGLineElement>(null);
    const gettersRef = useRef({ getLeftElement, getRightElement, areaRef });
    gettersRef.current = { getLeftElement, getRightElement, areaRef };

    useImperativeHandle(ref, () => ({
      setRubberBand(leftId: string, pointerX: number, pointerY: number) {
        const area = gettersRef.current.areaRef.current;
        const leftEl = gettersRef.current.getLeftElement(leftId);
        const line = rubberLineRef.current;
        if (!area || !leftEl || !line) return;

        const containerRect = rectFromDomRect(area.getBoundingClientRect());
        const segment = rubberBandSegment(
          rectFromDomRect(leftEl.getBoundingClientRect()),
          { x: pointerX, y: pointerY },
          containerRect,
        );
        line.setAttribute("x1", String(segment.x1));
        line.setAttribute("y1", String(segment.y1));
        line.setAttribute("x2", String(segment.x2));
        line.setAttribute("y2", String(segment.y2));
        line.style.display = "";
      },
      clearRubberBand() {
        const line = rubberLineRef.current;
        if (line) line.style.display = "none";
      },
    }));

    useLayoutEffect(() => {
      const area = areaRef.current;
      if (!area) {
        setSegments([]);
        return;
      }

      let frame = 0;
      frame = requestAnimationFrame(() => {
        const containerRect = rectFromDomRect(area.getBoundingClientRect());
        const nextSegments: Array<MatchingLineSegment & { key: string }> = [];

        for (const [leftId, rightId] of Object.entries(pairs)) {
          if (!rightId) continue;
          const leftEl = getLeftElement(leftId);
          const rightEl = getRightElement(rightId);
          if (!leftEl || !rightEl) continue;
          nextSegments.push({
            key: `${leftId}:${rightId}`,
            ...segmentBetweenElements(
              rectFromDomRect(leftEl.getBoundingClientRect()),
              rectFromDomRect(rightEl.getBoundingClientRect()),
              containerRect,
            ),
          });
        }

        setSegments(nextSegments);
      });

      return () => cancelAnimationFrame(frame);
    }, [areaRef, getLeftElement, getRightElement, pairs, geometryVersion]);

    return (
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      >
        {segments.map((segment) => (
          <line
            key={segment.key}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke="var(--matching-line-color)"
            strokeWidth="var(--matching-line-width)"
            strokeLinecap="round"
          />
        ))}
        <line
          ref={rubberLineRef}
          style={{ display: "none" }}
          stroke="var(--matching-line-color)"
          strokeWidth="var(--matching-line-width)"
          strokeLinecap="round"
          opacity={0.85}
        />
      </svg>
    );
  },
);

MatchingLineLayer.displayName = "MatchingLineLayer";
