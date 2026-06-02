"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HubPage } from "@/components/game/layout/HubPage";
import { LeaderboardView } from "@/components/game/screens/LeaderboardView";
import { getLeaderboard, type LeaderboardDto } from "@/lib/api-client";
import { useGameSession } from "@/lib/game/session-context";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";

export default function LeaderboardPage() {
  const router = useRouter();
  const { token, clearSession } = useGameSession();
  const mountedRef = useRef(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LeaderboardDto | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setPending(true);
    setError(null);
    const result = await getLeaderboard(token);
    if (!mountedRef.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      toastBlockingApiError(result);
      setError(result.error);
      setPending(false);
      return;
    }
    setData(result.data);
    setPending(false);
  }, [clearSession, router, token]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return (
    <HubPage title="Classifica" onBack={() => router.push("/menu")}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={load} disabled={pending}>
            {pending ? "Aggiornamento..." : "Aggiorna"}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {data ? <LeaderboardView data={data} /> : null}
      </div>
    </HubPage>
  );
}
