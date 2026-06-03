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
        "shrink-0",
        isHub ? "game-hub-header game-panel game-panel-inset" : "game-play-header",
      )}
    >
      <div
        className={cn(
          "flex w-full min-w-0 items-center gap-3",
          !leading && !title && "justify-end",
          !leading && title && "justify-between",
        )}
      >
        {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
        {title ? (
          <h1 className="game-hub-header__title" title={title}>
            {title}
          </h1>
        ) : null}
        {actions ? (
          <div
            className={cn(
              "flex shrink-0 items-center gap-2",
              isHub && "game-hub-header__actions",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
