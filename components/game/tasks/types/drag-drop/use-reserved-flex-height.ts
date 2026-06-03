"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Remembers the tallest measured height of a flex tile area so layout does not jump when items are removed.
 */
export function useReservedFlexHeight(resetKey: string, hasItems: boolean) {
  const areaRef = useRef<HTMLDivElement>(null);
  const resetKeyRef = useRef(resetKey);
  const [reservedMinHeight, setReservedMinHeight] = useState(0);

  useLayoutEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      setReservedMinHeight(0);
    }

    if (!hasItems) return;

    const element = areaRef.current;
    if (!element) return;

    const height = Math.ceil(element.getBoundingClientRect().height);
    setReservedMinHeight((previous) => (height > previous ? height : previous));
  }, [hasItems, resetKey]);

  return { areaRef, reservedMinHeight };
}
