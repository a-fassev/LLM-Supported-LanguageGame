import type { PointerEvent as ReactPointerEvent } from "react";

/** Pointer position within a tile button, plus its layout box (for drag preview). */
export function readTileGrabOffset(event: ReactPointerEvent<HTMLButtonElement>): {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
} {
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  const native = event.nativeEvent;

  let offsetX = event.clientX - rect.left;
  let offsetY = event.clientY - rect.top;

  if (typeof native.offsetX === "number" && Number.isFinite(native.offsetX)) {
    offsetX = native.offsetX;
  }
  if (typeof native.offsetY === "number" && Number.isFinite(native.offsetY)) {
    offsetY = native.offsetY;
  }

  return {
    offsetX,
    offsetY,
    width: rect.width,
    height: rect.height,
  };
}
