"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GameBackground } from "@/components/game/layout/GameBackground";
import {
  authBackgroundKeyForPath,
  authBackgroundPreloadKeys,
} from "@/lib/game/content/hub-background-keys";
import { useGameSession } from "@/lib/game/session-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isReady } = useGameSession();
  const assetKey = authBackgroundKeyForPath(pathname);

  useEffect(() => {
    if (!isReady) return;
    if (token) router.replace("/menu");
  }, [isReady, router, token]);

  return (
    <GameBackground
      assetKey={assetKey}
      preloadAssetKeys={authBackgroundPreloadKeys}
      mode="hub"
    >
      {!isReady ? (
        <main className="flex min-h-dvh items-center justify-center">
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </main>
      ) : (
        children
      )}
    </GameBackground>
  );
}
