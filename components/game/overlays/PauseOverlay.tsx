"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent
        showCloseButton={false}
        className="game-panel max-w-md gap-0 border-0 p-0 shadow-lg ring-0 sm:max-w-md"
      >
        <div className="game-panel-inset flex flex-col gap-5 text-base">
          <DialogHeader className="gap-3 text-left">
            <DialogTitle className="game-hub-header__title text-left">Pausa</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              Scegli come continuare la tua avventura.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={onResume}>
              Continua a giocare
            </Button>
            <Button size="lg" variant="outline" onClick={onBackToQuestList}>
              Torna alle missioni
            </Button>
            <Button size="lg" variant="outline" onClick={onBackToMenu}>
              Menu principale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
