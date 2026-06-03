"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/api-client";
import { useGameSession } from "@/lib/game/session-context";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";

export function MainMenuActions() {
  const router = useRouter();
  const { token, clearSession } = useGameSession();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    if (token) {
      const result = await logout(token);
      if (!result.ok) toastBlockingApiError(result);
    }
    clearSession();
    router.replace("/login");
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={() => router.push("/chapters")}>Gioca</Button>
      <Button variant="secondary" onClick={() => router.push("/shop")}>
        Negozio
      </Button>
      <Button variant="secondary" onClick={() => router.push("/leaderboard")}>
        Classifica
      </Button>
      <Button variant="outline" onClick={onLogout} disabled={pending}>
        Esci
      </Button>
    </div>
  );
}
