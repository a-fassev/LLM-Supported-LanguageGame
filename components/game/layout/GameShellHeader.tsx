import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const HUB_STICKER_TITLE_CLASS =
  "inline-block -rotate-1 rounded-[1.5rem] border-[4px] border-[#fff6d8] bg-[#f8b93b] px-4 py-1 text-[clamp(2rem,4vw,3.25rem)] font-black leading-none text-[#fff8df] shadow-[0_4px_0_#a63e1b,0_10px_20px_rgba(67,24,8,0.35)] [text-shadow:2px_2px_0_#a63e1b,-1.5px_-1.5px_0_#fff6d8,1.5px_-1.5px_0_#fff6d8,-1.5px_1.5px_0_#fff6d8,0_3px_0_#d66b22]";
const PLAY_STICKER_TITLE_CLASS =
  "max-w-full whitespace-normal text-center !text-[clamp(1.1rem,4vw,2rem)] !leading-tight [overflow-wrap:normal] [word-break:normal]";

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
  const hasHubActions = isHub && Boolean(actions);

  return (
    <header
      className={cn(
        "shrink-0 mx-auto mt-4 w-full",
        isHub
          ? "game-hub-header game-panel game-panel-inset !border-transparent !bg-transparent !shadow-none !ring-0 !backdrop-blur-0"
          : "game-play-header",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full min-w-0 items-center gap-3",
          !isHub && "flex-wrap lg:flex-nowrap",
          hasHubActions && "flex-wrap lg:flex-nowrap",
          !leading && !title && "justify-end",
          !leading && title && "justify-between",
        )}
      >
        {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
        {title ? (
          <h1
            className={cn(
              "game-hub-header__title overflow-visible",
              hasHubActions &&
                "order-2 basis-full !whitespace-normal text-center lg:order-none lg:basis-auto lg:text-left",
              !isHub &&
                "order-2 basis-full !whitespace-normal text-center lg:order-none lg:basis-auto lg:text-left",
              titleClassName,
            )}
            title={title}
          >
            <span
              className={cn(
                HUB_STICKER_TITLE_CLASS,
                hasHubActions && "max-w-full whitespace-normal [overflow-wrap:normal] [word-break:normal]",
                !isHub && PLAY_STICKER_TITLE_CLASS,
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
              hasHubActions && "order-1 ml-auto lg:order-none lg:ml-0",
              !isHub && "order-1 ml-auto lg:order-none lg:ml-0",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
