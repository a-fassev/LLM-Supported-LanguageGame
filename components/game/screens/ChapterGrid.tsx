"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BootstrapChapterDto } from "@/lib/api-client";

type ChapterGridItem = {
  chapter: BootstrapChapterDto;
  locked: boolean;
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
        "grid min-h-0 content-start grid-cols-1 gap-y-55 md:-mt-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3",
        className,
      )}
    >
      {items.map(({ chapter, locked }) => (
        <button
          key={chapter.id}
          type="button"
          onClick={() => onOpenChapter(chapter.id)}
          disabled={locked}
          className={cn(
            "relative aspect-[1448/1086] w-full max-w-[820px] overflow-hidden border-0 bg-transparent p-0 text-left shadow-none transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            locked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-90",
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
          <div className="absolute left-[30%] top-[35%] z-10 flex max-w-[48%] flex-col items-start gap-2 text-[#5a2612]">
            {locked ? (
              <Badge className="shrink-0 text-[#5a2612]" variant="outline">
                Bloccato
              </Badge>
            ) : (
              <Badge className="shrink-0 bg-[#5a2612] text-white">Sbloccato</Badge>
            )}
            <h2 className="min-w-0 text-xl font-bold leading-tight tracking-tight md:text-2xl">
              {chapter.title}
            </h2>
          </div>
        </button>
      ))}
    </div>
  );
}
