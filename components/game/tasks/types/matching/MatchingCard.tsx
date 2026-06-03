"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type MatchingCardProps = {
  id: string;
  label: string;
  side: "left" | "right";
  selected?: boolean;
  paired?: boolean;
  hasTrailingAction?: boolean;
  disabled?: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
};

export const MatchingCard = forwardRef<HTMLButtonElement, MatchingCardProps>(function MatchingCard(
  {
    id,
    label,
    side,
    selected = false,
    paired = false,
    hasTrailingAction = false,
    disabled = false,
    onPointerDown,
    onPointerUp,
    onKeyDown,
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      data-matching-card-id={id}
      data-matching-side={side}
      disabled={disabled}
      aria-selected={side === "left" ? selected : undefined}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn(
        "flex min-h-14 w-full items-center rounded-md border bg-background/90 px-3 py-3.5 text-left text-sm leading-snug transition-colors",
        hasTrailingAction && "pr-9",
        "hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60",
        selected && side === "left" && "border-l-[3px] border-l-[var(--matching-line-color)] pl-[calc(0.75rem-3px)]",
        paired && "border-primary/40 bg-primary/5",
        !selected && !paired && "border-border",
      )}
    >
      {label}
    </button>
  );
});
