"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GameShellHeader } from "@/components/game/layout/GameShellHeader";
import { useRegisterHubBackground } from "@/lib/game/hub-background-context";
import type { ReactNode } from "react";

type HubPageProps = {
  title: string;
  backgroundKey?: string | null;
  preloadAssetKeys?: readonly string[];
  onBack?: () => void;
  backLabel?: string;
  backButtonClassName?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  headerClassName?: string;
  titleClassName?: string;
  titleContentClassName?: string;
  className?: string;
};

export function HubPage({
  title,
  backgroundKey,
  preloadAssetKeys,
  onBack,
  backLabel = "Indietro",
  backButtonClassName,
  headerRight,
  children,
  headerClassName,
  titleClassName,
  titleContentClassName,
  className,
}: HubPageProps) {
  useRegisterHubBackground(backgroundKey, preloadAssetKeys);

  return (
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
              className={cn(
                "!bg-[#fbf0dc] !text-[#5a2612] hover:!bg-[#fbf0dc] hover:!text-[#5a2612]",
                backButtonClassName,
              )}
            >
              <ArrowLeft className="size-6 stroke-[2.75]" aria-hidden />
            </Button>
          ) : undefined
        }
        actions={headerRight}
        className={headerClassName}
        titleClassName={titleClassName}
        titleContentClassName={titleContentClassName}
      />
      <section
        className={cn(
          "game-panel game-panel-hub-body game-panel-inset min-h-0 flex-1 overflow-y-auto",
          className,
        )}
      >
        {children}
      </section>
    </main>
  );
}
