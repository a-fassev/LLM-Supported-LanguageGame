"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[50vh] rounded-lg border border-border p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Chiudi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
