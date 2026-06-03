"use client";

import { GameBackground } from "@/components/game/layout/GameBackground";
import { useHubBackground } from "@/lib/game/hub-background-context";

type HubBackgroundHostProps = {
  children: React.ReactNode;
};

/** Single hub background shell for all `(game)` routes except `/play`. */
export function HubBackgroundHost({ children }: HubBackgroundHostProps) {
  const { state } = useHubBackground();

  return (
    <GameBackground
      assetKey={state.assetKey}
      preloadAssetKeys={state.preloadAssetKeys}
      mode="hub"
    >
      {children}
    </GameBackground>
  );
}
