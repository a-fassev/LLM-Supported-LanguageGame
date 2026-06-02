"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HubPage } from "@/components/game/layout/HubPage";
import { ChapterGrid } from "@/components/game/screens/ChapterGrid";
import { getBootstrap, type BootstrapDto } from "@/lib/api-client";
import { useGameSession } from "@/lib/game/session-context";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";
import { isChapterLocked } from "@/lib/game/unlock-display";

export default function ChaptersPage() {
  const router = useRouter();
  const { token, clearSession } = useGameSession();
  const mountedRef = useRef(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BootstrapDto | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setPending(true);
    setError(null);
    const result = await getBootstrap(token);
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

  const chapterItems = useMemo(() => {
    if (!data) return [];
    const completedSet = new Set(data.completedQuestIds);
    return data.chapters
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((chapter, _, ordered) => ({
        chapter,
        locked: isChapterLocked(chapter, ordered, completedSet),
      }));
  }, [data]);

  return (
    <HubPage title="Capitoli" onBack={() => router.push("/menu")}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            🍕 {data?.totalSlices ?? 0} • 🎒 {data?.totalBackpackPieces ?? 0}%
          </p>
          <Button variant="outline" onClick={load} disabled={pending}>
            {pending ? "Aggiornamento..." : "Aggiorna"}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <ChapterGrid items={chapterItems} onOpenChapter={(chapterId) => router.push(`/chapters/${chapterId}`)} />
      </div>
    </HubPage>
  );
}
