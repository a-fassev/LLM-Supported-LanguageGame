import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GameBackground } from "@/components/game/layout/GameBackground";
import { GameShellHeader } from "@/components/game/layout/GameShellHeader";
import type { ReactNode } from "react";

type HubPageProps = {
  title: string;
  backgroundKey?: string | null;
  onBack?: () => void;
  backLabel?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function HubPage({
  title,
  backgroundKey,
  onBack,
  backLabel = "Indietro",
  headerRight,
  children,
  className,
}: HubPageProps) {
  return (
    <GameBackground assetKey={backgroundKey} mode="hub">
      <main className="game-shell-inset flex flex-col gap-4">
        <GameShellHeader
          title={title}
          variant="hub"
          leading={
            onBack ? (
              <Button
                type="button"
                size="icon-lg"
                variant="outline"
                aria-label={backLabel}
                onClick={onBack}
              >
                <ArrowLeft className="size-6 stroke-[2.75]" aria-hidden />
              </Button>
            ) : undefined
          }
          actions={headerRight}
        />
        <section className={cn("game-panel game-panel-inset min-h-0 flex-1 overflow-y-auto", className)}>
          {children}
        </section>
      </main>
    </GameBackground>
  );
}
