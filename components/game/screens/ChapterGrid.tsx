"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BootstrapChapterDto } from "@/lib/api-client";
import { isGameTestingReplayMode } from "@/lib/game/game-testing-replay-mode";

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

function renderChapterCardTitle(title: string) {
  const [place, day] = title.split(" — ");

  if (!place || !day) return title;

  return (
    <>
      {place} —
      <br />
      {day}
    </>
  );
}

export function ChapterGrid({ items, onOpenChapter, className }: ChapterGridProps) {
  return (
    <div
      className={cn(
        "grid min-h-0 content-start grid-cols-1 gap-y-30 md:-mt-8 md:grid-cols-2 md:gap-10 md:gap-y-40 lg:grid-cols-3 lg:gap-y-40",
        className,
      )}
    >
      {items.map(({ chapter, locked, mainComplete, fullyComplete }) => {
        const playable = isGameTestingReplayMode() || (!locked && !fullyComplete);

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
              "relative aspect-[1448/1086] w-[120%] max-w-[820px] -translate-x-[10%] overflow-hidden border-0 bg-transparent p-0 text-left shadow-none transition-opacity [container-type:inline-size] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed sm:w-full sm:translate-x-0",
              playable && "cursor-pointer hover:opacity-90",
              !playable && "cursor-not-allowed",
              locked && "opacity-60",
            )}
          >
            <Image
              src="/content-assets/hubs/chapters/papernotiz-ripped.png"
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, calc(100vw - 5rem)"
              className="pointer-events-none absolute inset-0 z-0 select-none object-contain"
              draggable={false}
            />
            <div className="absolute left-[28%] top-[33%] z-10 flex max-w-[48%] flex-col items-start gap-2 text-[#5a2612] sm:left-[30%] sm:top-[35%]">
              {locked ? (
                <Badge className="shrink-0 text-[clamp(0.62rem,3.1cqw,0.75rem)] text-[#5a2612]" variant="outline">
                  Bloccato
                </Badge>
              ) : fullyComplete ? (
                <Badge className="shrink-0 text-[clamp(0.62rem,3.1cqw,0.75rem)] text-[#5a2612]" variant="secondary">
                  Completato
                </Badge>
              ) : (
                <Badge className="shrink-0 bg-[#5a2612] text-[clamp(0.62rem,3.1cqw,0.75rem)] text-white">Sbloccato</Badge>
              )}
              <h2 className="min-w-0 text-[clamp(1rem,6cqw,1.5rem)] font-bold leading-tight tracking-tight">
                {renderChapterCardTitle(chapter.title)}
              </h2>
            </div>
          </button>
        );
      })}
    </div>
  );
}
