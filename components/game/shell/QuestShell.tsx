import { GameBackground } from "@/components/game/layout/GameBackground";
import { QuestNavBar } from "@/components/game/shell/QuestNavBar";

type QuestShellProps = {
  backgroundKey?: string | null;
  showHud: boolean;
  showDocument: boolean;
  totalSlices: number;
  totalBackpackPieces: number;
  onOpenPause: () => void;
  onOpenDocument?: () => void;
  children: React.ReactNode;
};

export function QuestShell({
  backgroundKey,
  showHud,
  showDocument,
  totalSlices,
  totalBackpackPieces,
  onOpenPause,
  onOpenDocument,
  children,
}: QuestShellProps) {
  return (
    <GameBackground assetKey={backgroundKey} mode="play">
      <QuestNavBar
        showHud={showHud}
        showDocument={showDocument}
        totalSlices={totalSlices}
        totalBackpackPieces={totalBackpackPieces}
        onOpenPause={onOpenPause}
        onOpenDocument={onOpenDocument}
      />
      {children}
    </GameBackground>
  );
}
