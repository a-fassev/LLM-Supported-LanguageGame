"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TASK_PLAY_BODY_TEXT } from "@/lib/game/task-typography";

type ReferenceDocumentOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  body: string;
};

export function ReferenceDocumentOverlay({
  open,
  onOpenChange,
  title = "Documento",
  body,
}: ReferenceDocumentOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="game-panel w-[calc(100%-2rem)] max-w-5xl gap-0 border-0 p-0 shadow-lg ring-0 sm:max-w-5xl"
      >
        <div className="game-panel-inset flex flex-col gap-5 text-base">
          <DialogHeader className="gap-3 text-left">
            <DialogTitle className="game-hub-header__title text-left">{title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[50vh] rounded-lg border border-border">
            <div className="p-4">
              <p className={cn("whitespace-pre-wrap", TASK_PLAY_BODY_TEXT)}>{body}</p>
            </div>
          </ScrollArea>
          <div className="flex justify-end">
            <Button size="lg" onClick={() => onOpenChange(false)}>
              Chiudi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
