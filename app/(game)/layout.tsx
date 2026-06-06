"use client";

import { useEffect } from "react";
import Image from "next/image";
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
    return (
      <>
        <GameBrandMark />
        {children}
      </>
    );
  }

  return (
    <HubBackgroundProvider>
      <HubBackgroundHost>
        <GameBrandMark />
        {children}
      </HubBackgroundHost>
    </HubBackgroundProvider>
  );
}

function GameBrandMark() {
  return (
    <div className="pointer-events-none fixed left-3 top-3 z-50 flex items-center gap-2 text-sm font-medium text-[#5a2612] sm:left-4 sm:top-4">
      <Image
        src="/content-assets/hubs/brand/bologna-icon-new.png"
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 object-contain"
        priority
      />
      <span>L&apos;enigma di Bologna</span>
    </div>
  );
}
