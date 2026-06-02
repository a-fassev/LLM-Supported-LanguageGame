"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameSession } from "@/lib/game/session-context";

export default function Home() {
  const router = useRouter();
  const { token, isReady } = useGameSession();

  useEffect(() => {
    if (!isReady) return;
    router.replace(token ? "/menu" : "/login");
  }, [isReady, router, token]);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-muted-foreground">Reindirizzamento...</p>
    </main>
  );
}
