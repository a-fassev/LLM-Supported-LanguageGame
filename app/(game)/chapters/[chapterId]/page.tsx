"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { HubPage } from "@/components/game/layout/HubPage";
import { QuestHud } from "@/components/game/shell/QuestHud";
import { QuestList } from "@/components/game/screens/QuestList";
import type { BootstrapChapterDto } from "@/lib/api-client";
import { useBootstrap } from "@/lib/game/use-bootstrap";
import { isChapterLocked, isQuestCompleted, isQuestLocked } from "@/lib/game/unlock-display";

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

  useEffect(() => {
    if (!chapter || !data) return;
    const completedSet = new Set(data.completedQuestIds);
    const orderedChapters = data.chapters.slice().sort((a, b) => a.order - b.order);
    if (isChapterLocked(chapter, orderedChapters, completedSet)) {
      router.replace("/chapters");
    }
  }, [chapter, data, router]);

  const headerRight = data ? (
    <QuestHud totalSlices={data.totalSlices} totalBackpackPieces={data.totalBackpackPieces} />
  ) : null;

  return (
    <HubPage
      title={chapter?.title ?? "Missioni"}
      onBack={() => router.push("/chapters")}
      headerRight={headerRight}
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
          <QuestList
            items={items}
            onStartQuest={(questId) => router.push(`/play?chapterId=${chapter.id}&questId=${questId}`)}
          />
        ) : null}
      </div>
    </HubPage>
  );
}
