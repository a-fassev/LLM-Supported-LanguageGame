import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameBackground } from "@/components/game/layout/GameBackground";

type HubPageProps = {
  title: string;
  backgroundKey?: string | null;
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
};

export function HubPage({
  title,
  backgroundKey,
  onBack,
  backLabel = "Indietro",
  children,
  className,
}: HubPageProps) {
  return (
    <GameBackground assetKey={backgroundKey} mode="hub">
      <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-5 px-4 py-6 md:px-6">
        <header className="flex items-center justify-between">
          {onBack ? (
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Button>
          ) : (
            <span />
          )}
          <h1 className="game-panel px-4 py-2 text-lg font-semibold md:text-xl">{title}</h1>
        </header>
        <section className={cn("game-panel flex-1 p-4 md:p-6", className)}>{children}</section>
      </main>
    </GameBackground>
  );
}
