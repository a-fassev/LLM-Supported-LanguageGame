"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameSession } from "@/lib/game/session-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isReady } = useGameSession();

  useEffect(() => {
    if (!isReady) return;
    if (token) router.replace("/menu");
  }, [isReady, router, token]);

  if (!isReady) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      </main>
    );
  }

  return <>{children}</>;
}
