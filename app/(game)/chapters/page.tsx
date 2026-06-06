"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { HubPage } from "@/components/game/layout/HubPage";
import { QuestHud } from "@/components/game/shell/QuestHud";
import { ChapterGrid } from "@/components/game/screens/ChapterGrid";
import { useBootstrap } from "@/lib/game/use-bootstrap";
import { isChapterLocked } from "@/lib/game/unlock-display";

export default function ChaptersPage() {
  const router = useRouter();
  const { loading, error, data } = useBootstrap({ refreshOnFocus: true });

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

  const headerRight = data ? (
    <QuestHud totalSlices={data.totalSlices} totalBackpackPieces={data.totalBackpackPieces} />
  ) : null;

  return (
    <HubPage
      title="Capitoli"
      onBack={() => router.push("/menu")}
      headerRight={headerRight}
      className="scrollbar-hide flex min-h-0 flex-col overflow-x-hidden overflow-y-auto border-0 bg-transparent shadow-none ring-0 backdrop-blur-0"
    >
      {error ? <p className="shrink-0 text-sm text-destructive">{error}</p> : null}
      {loading && !data ? (
        <p className="shrink-0 text-sm text-muted-foreground">Caricamento capitoli...</p>
      ) : null}
      {data && data.chapters.length === 0 ? (
        <p className="shrink-0 text-sm text-muted-foreground">Nessun capitolo disponibile.</p>
      ) : null}
      {data && data.chapters.length > 0 ? (
        <ChapterGrid
          className="min-h-0 flex-1"
          items={chapterItems}
          onOpenChapter={(chapterId) => router.push(`/chapters/${chapterId}`)}
        />
      ) : null}
    </HubPage>
  );
}
