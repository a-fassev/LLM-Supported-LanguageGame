"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HubPage } from "@/components/game/layout/HubPage";
import { ChapterGrid } from "@/components/game/screens/ChapterGrid";
import { useBootstrap } from "@/lib/game/use-bootstrap";
import { isChapterLocked } from "@/lib/game/unlock-display";

export default function ChaptersPage() {
  const router = useRouter();
  const { loading, refreshing, error, data, reload } = useBootstrap({ refreshOnFocus: true });

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
        {data ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              🍕 {data.totalSlices} • 🎒 {data.totalBackpackPieces}%
            </p>
            <Button variant="outline" onClick={() => void reload()} disabled={refreshing}>
              {refreshing ? "Aggiornamento..." : "Aggiorna"}
            </Button>
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Caricamento capitoli...</p>
        ) : null}
        {data && data.chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun capitolo disponibile.</p>
        ) : null}
        {data && data.chapters.length > 0 ? (
          <ChapterGrid items={chapterItems} onOpenChapter={(chapterId) => router.push(`/chapters/${chapterId}`)} />
        ) : null}
      </div>
    </HubPage>
  );
}
