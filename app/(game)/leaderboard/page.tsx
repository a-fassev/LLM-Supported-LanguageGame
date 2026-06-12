"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HubPage } from "@/components/game/layout/HubPage";
import { LeaderboardView } from "@/components/game/screens/LeaderboardView";
import { getLeaderboard, type LeaderboardDto } from "@/lib/api-client";
import { hubBackgroundKeys } from "@/lib/game/content/hub-background-keys";
import { useGameSession } from "@/lib/game/session-context";
import { useMountedRef } from "@/lib/game/use-mounted-ref";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";

export default function LeaderboardPage() {
  const router = useRouter();
  const { token, clearSession } = useGameSession();
  const mountedRef = useMountedRef();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LeaderboardDto | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setPending(false);
      return;
    }
    setPending(true);
    setError(null);
    const result = await getLeaderboard(token);
    if (!mountedRef.current) return;
    if (!result.ok) {
      if (result.status === 401) {
        clearSession();
        setPending(false);
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
  }, [clearSession, mountedRef, router, token]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return (
    <HubPage
      title="Classifica"
      backgroundKey={hubBackgroundKeys.leaderboardBrickwall}
      onBack={() => router.push("/menu")}
      className="flex flex-col overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {pending && !data ? (
          <p className="text-base text-muted-foreground">Caricamento classifica...</p>
        ) : null}
        {error ? <p className="text-base text-destructive">{error}</p> : null}
        {data ? (
          <LeaderboardView
            className="min-h-0 flex-1"
            data={data}
            onRefresh={() => void load()}
            refreshing={pending}
          />
        ) : null}
      </div>
    </HubPage>
  );
}
