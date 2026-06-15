"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GameBackground } from "@/components/game/layout/GameBackground";
import { HubBackgroundHost } from "@/components/game/layout/HubBackgroundHost";
import { HubBackgroundProvider } from "@/lib/game/hub-background-context";
import { useGameSession } from "@/lib/game/session-context";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isReady } = useGameSession();
  const isPlayRoute = pathname === "/play";

  useEffect(() => {
    if (!isReady) return;
    if (!token) router.replace("/login");
  }, [isReady, router, token]);

  if (!isReady || !token) {
    return (
      <GameBackground mode="hub">
        <main className="flex min-h-dvh items-center justify-center">
          <p className="text-sm text-muted-foreground">Caricamento sessione...</p>
        </main>
      </GameBackground>
    );
  }

  if (isPlayRoute) {
    return children;
  }

  return (
    <HubBackgroundProvider>
      <HubBackgroundHost>{children}</HubBackgroundHost>
    </HubBackgroundProvider>
  );
}
