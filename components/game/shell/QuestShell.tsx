import { BookOpenText, Pause } from "lucide-react";
import { GameShellHeader } from "@/components/game/layout/GameShellHeader";
import { QuestHud } from "@/components/game/shell/QuestHud";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuestShellProps = {
  /** Task scenes: `content.title` when authored. */
  headerTitle?: string | null;
  showHud: boolean;
  showDocument: boolean;
  totalSlices: number;
  totalBackpackPieces: number;
  onOpenPause: () => void;
  onOpenDocument?: () => void;
  children: React.ReactNode;
  /** Large inset panel around play content — tasks only; story uses background + StoryPanel. */
  showContentPanel?: boolean;
  contentClassName?: string;
};

export function QuestShell({
  headerTitle,
  showHud,
  showDocument,
  totalSlices,
  totalBackpackPieces,
  onOpenPause,
  onOpenDocument,
  children,
  showContentPanel = false,
  contentClassName,
}: QuestShellProps) {
  return (
    <main className="game-shell-inset flex h-full min-h-0 flex-col gap-4">
      <GameShellHeader
        variant="play"
        title={headerTitle ?? undefined}
        actions={
          <>
            {showDocument ? (
              <Button size="lg" variant="outline" onClick={onOpenDocument}>
                <BookOpenText className="mr-2 h-5 w-5" />
                Documento
              </Button>
            ) : null}
            {showHud ? (
              <QuestHud totalSlices={totalSlices} totalBackpackPieces={totalBackpackPieces} />
            ) : null}
            <Button size="lg" variant="outline" onClick={onOpenPause} className="bg-[#fbf0dc] text-[#5a2612] hover:bg-[#fbf0dc] hover:text-[#5a2612]">
              <Pause className="mr-2 h-5 w-5" />
              Pausa
            </Button>
          </>
        }
      />
      <section
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          showContentPanel && "game-panel game-panel-inset",
          contentClassName,
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </section>
    </main>
  );
}
