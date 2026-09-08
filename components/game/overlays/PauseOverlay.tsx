"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SceneJumpTargetDto } from "@/lib/api-client";

type PauseOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResume: () => void;
  onBackToQuestList: () => void;
  onBackToMenu: () => void;
  sceneJumpTargets?: SceneJumpTargetDto[];
  currentSceneId?: string | null;
  jumpPending?: boolean;
  onJumpScene?: (targetSceneId: string) => void;
};

export function PauseOverlay({
  open,
  onOpenChange,
  onResume,
  onBackToQuestList,
  onBackToMenu,
  sceneJumpTargets,
  currentSceneId,
  jumpPending = false,
  onJumpScene,
}: PauseOverlayProps) {
  const showJumpList = Boolean(sceneJumpTargets && sceneJumpTargets.length > 0 && onJumpScene);

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
            {showJumpList ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-[#5a2612]">Salta alla scena</p>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-[#8f5a33]/20 p-2">
                  {sceneJumpTargets?.map((target) => {
                    const isCurrent = target.id === currentSceneId;
                    return (
                      <Button
                        key={target.id}
                        size="sm"
                        variant={isCurrent ? "secondary" : "ghost"}
                        className="mb-1 w-full justify-start last:mb-0"
                        disabled={jumpPending || isCurrent}
                        onClick={() => onJumpScene?.(target.id)}
                      >
                        {target.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
