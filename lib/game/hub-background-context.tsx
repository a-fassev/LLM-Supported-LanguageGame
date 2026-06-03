"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type HubBackgroundState = {
  assetKey: string | null;
  preloadAssetKeys?: readonly string[];
};

type HubBackgroundContextValue = {
  state: HubBackgroundState;
  setHubBackground: (next: HubBackgroundState) => void;
};

const defaultState: HubBackgroundState = { assetKey: null };

const HubBackgroundContext = createContext<HubBackgroundContextValue | null>(null);

export function HubBackgroundProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HubBackgroundState>(defaultState);

  const setHubBackground = useCallback((next: HubBackgroundState) => {
    setState(next);
  }, []);

  const value = useMemo(
    () => ({ state, setHubBackground }),
    [setHubBackground, state],
  );

  return <HubBackgroundContext.Provider value={value}>{children}</HubBackgroundContext.Provider>;
}

export function useHubBackground(): HubBackgroundContextValue {
  const value = useContext(HubBackgroundContext);
  if (!value) {
    throw new Error("useHubBackground must be used inside HubBackgroundProvider.");
  }
  return value;
}

/** Registers a hub route background while mounted; clears on unmount. */
export function useRegisterHubBackground(
  assetKey: string | null | undefined,
  preloadAssetKeys?: readonly string[],
): void {
  const { setHubBackground } = useHubBackground();

  const preloadKey = preloadAssetKeys?.join("\0") ?? "";

  useEffect(() => {
    setHubBackground({
      assetKey: assetKey ?? null,
      preloadAssetKeys,
    });
    return () => setHubBackground(defaultState);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preloadKey serializes readonly array
  }, [assetKey, preloadKey, setHubBackground]);
}
