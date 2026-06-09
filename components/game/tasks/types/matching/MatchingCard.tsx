"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
  TASK_REVIEW_CORRECT,
  TASK_REVIEW_INCORRECT,
} from "@/lib/game/task-review-styles";
import { TASK_PLAY_BODY_TEXT } from "@/lib/game/task-typography";

type MatchingCardProps = {
  id: string;
  label: string;
  side: "left" | "right";
  selected?: boolean;
  paired?: boolean;
  hasTrailingAction?: boolean;
  disabled?: boolean;
  reviewStatus?: "correct" | "incorrect" | null;
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
    reviewStatus = null,
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
        "flex min-h-16 w-full items-center rounded-md border bg-background/90 px-3 py-3.5 text-left transition-colors",
        TASK_PLAY_BODY_TEXT,
        hasTrailingAction && "pr-9",
        "hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60",
        selected && side === "left" && "border-l-[3px] border-l-[var(--matching-line-color)] pl-[calc(0.75rem-3px)]",
        paired && !reviewStatus && "border-primary/40 bg-primary/5",
        reviewStatus === "correct" && TASK_REVIEW_CORRECT,
        reviewStatus === "incorrect" && TASK_REVIEW_INCORRECT,
        !selected && !paired && !reviewStatus && "border-border",
      )}
    >
      {label}
    </button>
  );
});
