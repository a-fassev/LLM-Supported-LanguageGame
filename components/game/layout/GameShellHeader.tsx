import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GameShellHeaderProps = {
  title?: string;
  variant?: "hub" | "play";
  /** Hub: back control aligned to the far left (e.g. icon button). */
  leading?: ReactNode;
  actions?: ReactNode;
};

export function GameShellHeader({ title, variant = "hub", leading, actions }: GameShellHeaderProps) {
  const isHub = variant === "hub";

  return (
    <header
      className={cn(
        "game-hub-header shrink-0",
        isHub ? "game-panel game-panel-inset" : "game-play-header",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          !leading && !title && "justify-end",
          !leading && title && "justify-between",
        )}
      >
        {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
        {title ? <h1 className="game-hub-header__title min-w-0 flex-1">{title}</h1> : null}
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
