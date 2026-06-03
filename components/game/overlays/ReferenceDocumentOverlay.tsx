"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resolveAssetUrl } from "@/lib/game/content/resolve-asset-url";
import { cn } from "@/lib/utils";
import type {
  ReferenceDocumentFigureView,
  ReferenceDocumentSectionView,
} from "@/lib/game/reference-document-view";
import {
  TASK_PLAY_BODY_TEXT,
  TASK_PLAY_META_TEXT,
  TASK_PLAY_SECTION_LABEL_TEXT,
} from "@/lib/game/task-typography";

export type { ReferenceDocumentFigureView, ReferenceDocumentSectionView };

export type ReferenceDocumentOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  body?: string;
  sections?: ReferenceDocumentSectionView[];
  figures?: ReferenceDocumentFigureView[];
};

function FigureCard({
  figure,
  className,
}: {
  figure: ReferenceDocumentFigureView;
  className?: string;
}) {
  const url = useMemo(() => resolveAssetUrl(figure.image), [figure.image]);
  const alt = figure.alt?.trim() || figure.caption;

  return (
    <figure
      className={cn(
        "flex w-full max-w-full flex-col gap-2 rounded-lg border border-border p-2",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
        {url ? (
          <Image
            src={url}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 360px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-2 text-center">
            <span className={cn(TASK_PLAY_META_TEXT, "text-muted-foreground")}>
              immagine non disponibile
            </span>
          </div>
        )}
      </div>
      <figcaption className={cn("text-center", TASK_PLAY_SECTION_LABEL_TEXT)}>{figure.caption}</figcaption>
    </figure>
  );
}

export function ReferenceDocumentOverlay({
  open,
  onOpenChange,
  title = "Documento",
  body,
  sections,
  figures,
}: ReferenceDocumentOverlayProps) {
  const intro = body?.trim();
  const hasSections = (sections?.length ?? 0) > 0;
  const hasFigures = (figures?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[calc(100%-2rem)] max-w-5xl flex-col gap-5 border-0 bg-background/95 p-6 shadow-xl ring-0 sm:max-w-5xl"
      >
        <DialogHeader className="gap-3 text-left">
          <DialogTitle className="game-hub-header__title text-left">{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[50vh] min-h-0 space-y-5 overflow-y-auto pr-1">
          {intro ? (
            <p className={cn("whitespace-pre-wrap", TASK_PLAY_BODY_TEXT)}>{intro}</p>
          ) : null}
          {hasSections
            ? sections!.map((section) => (
                <section key={section.title} className="space-y-2">
                  <h3 className={TASK_PLAY_SECTION_LABEL_TEXT}>{section.title}</h3>
                  <p className={cn("whitespace-pre-wrap", TASK_PLAY_BODY_TEXT)}>{section.body}</p>
                </section>
              ))
            : null}
          {hasFigures ? (
            <div
              className={cn(
                "grid gap-4",
                figures!.length === 1
                  ? "grid-cols-1 place-items-center"
                  : "grid-cols-1 md:grid-cols-2",
              )}
            >
              {figures!.map((figure, index) => (
                <FigureCard
                  key={`${figure.image}-${index}`}
                  figure={figure}
                  className={figures!.length === 1 ? "max-w-sm" : undefined}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button size="lg" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
