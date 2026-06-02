import { BookOpenText, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestHud } from "@/components/game/shell/QuestHud";

type QuestNavBarProps = {
  showHud: boolean;
  showDocument: boolean;
  totalSlices: number;
  totalBackpackPieces: number;
  onOpenPause: () => void;
  onOpenDocument?: () => void;
};

export function QuestNavBar({
  showHud,
  showDocument,
  totalSlices,
  totalBackpackPieces,
  onOpenPause,
  onOpenDocument,
}: QuestNavBarProps) {
  return (
    <div className="game-shell-top-bar">
      {showDocument ? (
        <Button variant="secondary" onClick={onOpenDocument}>
          <BookOpenText className="mr-2 h-4 w-4" />
          Documento
        </Button>
      ) : null}
      {showHud ? (
        <QuestHud totalSlices={totalSlices} totalBackpackPieces={totalBackpackPieces} />
      ) : null}
      <Button variant="default" onClick={onOpenPause}>
        <Pause className="mr-2 h-4 w-4" />
        Pausa
      </Button>
    </div>
  );
}
