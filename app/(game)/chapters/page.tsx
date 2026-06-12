"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { HubPage } from "@/components/game/layout/HubPage";
import { QuestHud } from "@/components/game/shell/QuestHud";
import { ChapterGrid } from "@/components/game/screens/ChapterGrid";
import { hubBackgroundKeys } from "@/lib/game/content/hub-background-keys";
import { useBootstrap } from "@/lib/game/use-bootstrap";
import {
  isChapterFullyComplete,
  isChapterLocked,
  isChapterMainProgressComplete,
} from "@/lib/game/unlock-display";

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
        mainComplete: isChapterMainProgressComplete(chapter, completedSet),
        fullyComplete: isChapterFullyComplete(chapter, completedSet),
      }));
  }, [data]);

  const headerRight = data ? (
    <QuestHud totalSlices={data.totalSlices} backpackProgressPercent={data.backpackProgressPercent} />
  ) : null;

  return (
    <HubPage
      title="Capitoli"
      backgroundKey={hubBackgroundKeys.bolognaMap}
      onBack={() => router.push("/menu")}
      headerRight={headerRight}
      className="scrollbar-hide flex min-h-0 flex-col overflow-x-hidden overflow-y-auto border-0 bg-transparent shadow-none ring-0 backdrop-blur-0 !backdrop-blur-none "
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
