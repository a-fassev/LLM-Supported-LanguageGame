"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BootstrapChapterDto } from "@/lib/api-client";

type ChapterGridItem = {
  chapter: BootstrapChapterDto;
  locked: boolean;
};

type ChapterGridProps = {
  items: ChapterGridItem[];
  onOpenChapter: (chapterId: string) => void;
};

export function ChapterGrid({ items, onOpenChapter }: ChapterGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(({ chapter, locked }) => (
        <article key={chapter.id} className="game-panel flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold md:text-lg">{chapter.title}</h2>
            {locked ? <Badge variant="outline">Bloccato</Badge> : <Badge>Sbloccato</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Missioni: {chapter.quests.length}</p>
          <Button onClick={() => onOpenChapter(chapter.id)} disabled={locked}>
            Apri capitolo
          </Button>
        </article>
      ))}
    </div>
  );
}
