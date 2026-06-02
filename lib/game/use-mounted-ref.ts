import { useEffect, useRef } from "react";

/**
 * Tracks whether the component is mounted. Resets to true on each mount so
 * React Strict Mode remounts do not leave the ref stuck false (useRef init runs once).
 */
export function useMountedRef() {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return mountedRef;
}
