"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BootstrapChapterDto } from "@/lib/api-client";

type ChapterGridItem = {
  chapter: BootstrapChapterDto;
  locked: boolean;
  mainComplete: boolean;
  fullyComplete: boolean;
};

type ChapterGridProps = {
  items: ChapterGridItem[];
  onOpenChapter: (chapterId: string) => void;
  className?: string;
};

export function ChapterGrid({ items, onOpenChapter, className }: ChapterGridProps) {
  return (
    <div
      className={cn(
        "grid h-full min-h-0 auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map(({ chapter, locked, mainComplete, fullyComplete }) => {
        const playable = !locked && !fullyComplete;

        return (
          <button
            key={chapter.id}
            type="button"
            onClick={() => playable && onOpenChapter(chapter.id)}
            disabled={!playable}
            aria-label={
              locked
                ? `${chapter.title}, capitolo bloccato`
                : fullyComplete
                  ? `${chapter.title}, capitolo completato`
                  : mainComplete
                    ? `${chapter.title}, missioni principali completate`
                    : chapter.title
            }
            className={cn(
              "game-panel flex h-full min-h-0 flex-col p-5 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
              playable && "cursor-pointer hover:opacity-90",
              !playable && "cursor-not-allowed",
              locked && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="min-w-0 flex-1 text-xl font-bold leading-tight tracking-tight md:text-2xl">
                {chapter.title}
              </h2>
              {locked ? (
                <Badge className="shrink-0" variant="outline">
                  Bloccato
                </Badge>
              ) : fullyComplete ? (
                <Badge className="shrink-0" variant="secondary">
                  Completato
                </Badge>
              ) : (
                <Badge className="shrink-0">Sbloccato</Badge>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
