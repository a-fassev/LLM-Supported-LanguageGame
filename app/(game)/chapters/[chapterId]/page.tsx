"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { HubPage } from "@/components/game/layout/HubPage";
import { QuestHud } from "@/components/game/shell/QuestHud";
import { QuestList } from "@/components/game/screens/QuestList";
import type { BootstrapChapterDto } from "@/lib/api-client";
import { useBootstrap } from "@/lib/game/use-bootstrap";
import { isGameTestingReplayMode } from "@/lib/game/game-testing-replay-mode";
import {
  isChapterFullyComplete,
  isChapterLocked,
  isQuestCompleted,
  isQuestLocked,
} from "@/lib/game/unlock-display";

export default function ChapterDetailPage() {
  const params = useParams<{ chapterId: string }>();
  const chapterId = params.chapterId;
  const router = useRouter();
  const { loading, error, data } = useBootstrap({ refreshOnFocus: true });

  const chapter = useMemo<BootstrapChapterDto | null>(() => {
    if (!data) return null;
    return data.chapters.find((item) => item.id === chapterId) ?? null;
  }, [chapterId, data]);

  const items = useMemo(() => {
    if (!chapter || !data) return [];
    const completedSet = new Set(data.completedQuestIds);
    const orderedChapters = data.chapters.slice().sort((a, b) => a.order - b.order);
    const chapterLocked = isChapterLocked(chapter, orderedChapters, completedSet);
    return chapter.quests
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((quest) => ({
        quest,
        locked: chapterLocked || isQuestLocked(chapter.id, quest, completedSet),
        completed: isQuestCompleted(chapter.id, quest, completedSet),
      }));
  }, [chapter, data]);

  const chapterFullyComplete = useMemo(() => {
    if (!chapter || !data) return false;
    return isChapterFullyComplete(chapter, new Set(data.completedQuestIds));
  }, [chapter, data]);

  useEffect(() => {
    if (!chapter || !data) return;
    const completedSet = new Set(data.completedQuestIds);
    const orderedChapters = data.chapters.slice().sort((a, b) => a.order - b.order);
    if (!isGameTestingReplayMode() && isChapterLocked(chapter, orderedChapters, completedSet)) {
      router.replace("/chapters");
    }
  }, [chapter, data, router]);

  const headerRight = data ? (
    <QuestHud totalSlices={data.totalSlices} backpackProgressPercent={data.backpackProgressPercent} />
  ) : null;

  return (
    <HubPage
      title={chapter?.title ?? "Missioni"}
      onBack={() => router.push("/chapters")}
      headerRight={headerRight}
      backgroundKey={chapter?.background ?? null}
    >
      <div className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Caricamento missioni...</p>
        ) : null}
        {data && !chapter ? (
          <p className="text-sm text-muted-foreground">Capitolo non trovato.</p>
        ) : null}
        {chapter ? (
          <>
            {chapterFullyComplete && !isGameTestingReplayMode() ? (
              <p className="text-sm text-muted-foreground">
                Tutte le missioni di questo capitolo sono completate. Puoi rivedere l&apos;elenco,
                ma non ripetere le missioni.
              </p>
            ) : null}
            <QuestList
              items={items}
              onStartQuest={(questId) => {
                const item = items.find((entry) => entry.quest.id === questId);
                if (!item) return;
                if (!isGameTestingReplayMode() && (item.locked || item.completed)) return;
                router.push(`/play?chapterId=${chapter.id}&questId=${questId}`);
              }}
            />
          </>
        ) : null}
      </div>
    </HubPage>
  );
}
