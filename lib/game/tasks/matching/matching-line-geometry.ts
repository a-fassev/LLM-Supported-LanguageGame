import type { MatchingPoint } from "@/lib/game/tasks/matching/matching-types";

export type RectLike = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function connectorPoint(rect: RectLike, edge: "left" | "right"): MatchingPoint {
  const y = rect.top + rect.height / 2;
  const x = edge === "left" ? rect.left : rect.left + rect.width;
  return { x, y };
}

export function toLocalPoint(point: MatchingPoint, containerRect: RectLike): MatchingPoint {
  return {
    x: point.x - containerRect.left,
    y: point.y - containerRect.top,
  };
}

export function segmentBetweenElements(
  leftRect: RectLike,
  rightRect: RectLike,
  containerRect: RectLike,
): { x1: number; y1: number; x2: number; y2: number } {
  const start = toLocalPoint(connectorPoint(leftRect, "right"), containerRect);
  const end = toLocalPoint(connectorPoint(rightRect, "left"), containerRect);
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

export function rubberBandSegment(
  leftRect: RectLike,
  pointer: MatchingPoint,
  containerRect: RectLike,
): { x1: number; y1: number; x2: number; y2: number } {
  const start = toLocalPoint(connectorPoint(leftRect, "right"), containerRect);
  const end = toLocalPoint(pointer, containerRect);
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

export function rectFromDomRect(rect: DOMRect): RectLike {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
