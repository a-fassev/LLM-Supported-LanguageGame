"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameSession } from "@/lib/game/session-context";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isReady } = useGameSession();

  useEffect(() => {
    if (!isReady) return;
    if (!token) router.replace("/login");
  }, [isReady, router, token]);

  if (!isReady || !token) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Caricamento sessione...</p>
      </main>
    );
  }

  return <>{children}</>;
}
