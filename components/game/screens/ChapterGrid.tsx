"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BootstrapChapterDto } from "@/lib/api-client";
import type { ChapterLockReason } from "@/lib/game/unlock-display";

type ChapterGridItem = {
  chapter: BootstrapChapterDto;
  locked: boolean;
  lockReason: ChapterLockReason;
  scheduleLockLabel: string | null;
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
    <div className={cn("space-y-5", className)}>
      {items.map(({ chapter, locked, lockReason, scheduleLockLabel, mainComplete, fullyComplete }) => {
        const playable = !locked && !fullyComplete;
        const lockedBadgeLabel =
          lockReason === "schedule" ? (scheduleLockLabel ?? "Presto disponibile") : "Bloccato";

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
              "game-panel flex min-h-16 w-full items-center justify-between gap-4 p-5 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
              playable && "cursor-pointer hover:opacity-90",
              !playable && "cursor-not-allowed",
              locked && !fullyComplete && "opacity-60",
            )}
          >
            <h2 className="min-w-0 flex-1 text-xl font-bold leading-tight tracking-tight md:text-2xl">
              {chapter.title}
            </h2>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {fullyComplete ? <Badge variant="secondary">Completato</Badge> : null}
              {locked && !fullyComplete ? <Badge variant="outline">{lockedBadgeLabel}</Badge> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
