"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HubPage } from "@/components/game/layout/HubPage";
import { QuestList } from "@/components/game/screens/QuestList";
import { getBootstrap, type BootstrapChapterDto, type BootstrapDto } from "@/lib/api-client";
import { useGameSession } from "@/lib/game/session-context";
import { toastBlockingApiError } from "@/lib/game/toast-from-api";
import { isQuestCompleted, isQuestLocked } from "@/lib/game/unlock-display";

export default function ChapterDetailPage() {
  const params = useParams<{ chapterId: string }>();
  const chapterId = params.chapterId;
  const router = useRouter();
  const { token, clearSession } = useGameSession();
  const mountedRef = useRef(true);
  const [data, setData] = useState<BootstrapDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
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
      return;
    }
    setData(result.data);
    setError(null);
  }, [clearSession, router, token]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const chapter = useMemo<BootstrapChapterDto | null>(() => {
    if (!data) return null;
    return data.chapters.find((item) => item.id === chapterId) ?? null;
  }, [chapterId, data]);

  const items = useMemo(() => {
    if (!chapter || !data) return [];
    const completedSet = new Set(data.completedQuestIds);
    return chapter.quests
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((quest) => ({
        quest,
        locked: isQuestLocked(quest, completedSet),
        completed: isQuestCompleted(quest, completedSet),
      }));
  }, [chapter, data]);

  return (
    <HubPage title={chapter?.title ?? "Missioni"} onBack={() => router.push("/chapters")}>
      <div className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!chapter ? <p className="text-sm text-muted-foreground">Capitolo non trovato.</p> : null}
        {chapter ? (
          <QuestList
            items={items}
            onStartQuest={(questId) => router.push(`/play?chapterId=${chapter.id}&questId=${questId}`)}
          />
        ) : null}
      </div>
    </HubPage>
  );
}
