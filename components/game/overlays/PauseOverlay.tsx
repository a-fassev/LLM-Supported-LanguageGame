"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PauseOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResume: () => void;
  onBackToQuestList: () => void;
  onBackToMenu: () => void;
};

export function PauseOverlay({
  open,
  onOpenChange,
  onResume,
  onBackToQuestList,
  onBackToMenu,
}: PauseOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pausa</DialogTitle>
          <DialogDescription>Scegli come continuare la tua avventura.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onResume}>Continua a giocare</Button>
          <Button variant="outline" onClick={onBackToQuestList}>
            Torna alle missioni
          </Button>
          <Button variant="ghost" onClick={onBackToMenu}>
            Menu principale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
