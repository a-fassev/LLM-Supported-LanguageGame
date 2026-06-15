import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GameShellHeaderProps = {
  title?: string;
  variant?: "hub" | "play";
  /** Hub: back control aligned to the far left (e.g. icon button). */
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  titleContentClassName?: string;
};

export function GameShellHeader({
  title,
  variant = "hub",
  leading,
  actions,
  className,
  titleClassName,
  titleContentClassName,
}: GameShellHeaderProps) {
  const isHub = variant === "hub";

  return (
    <header
      className={cn(
        "shrink-0 mx-auto mt-4 w-full overflow-visible",
        isHub ? "game-hub-header" : "game-play-header",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full min-w-0 flex-nowrap items-center gap-3",
          !leading && !title && "justify-end",
          !leading && title && "justify-between",
        )}
      >
        {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
        {title ? (
          <h1
            className={cn(
              isHub ? "game-hub-header__title" : "game-play-header__title",
              titleClassName,
            )}
            title={title}
          >
            <span
              className={cn(
                "game-sticker-title tracking-normal",
                isHub ? "game-sticker-title--hub" : "game-sticker-title--play",
                titleContentClassName,
              )}
            >
              {title}
            </span>
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
