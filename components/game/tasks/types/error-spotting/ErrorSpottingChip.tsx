"use client";

import { cn } from "@/lib/utils";
import { TASK_PLAY_BODY_TEXT } from "@/lib/game/task-typography";

type ErrorSpottingChipProps = {
  text: string;
  hint?: string;
  selected?: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function ErrorSpottingChip({
  text,
  hint,
  selected,
  disabled,
  onToggle,
}: ErrorSpottingChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={hint}
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "inline max-w-full cursor-pointer rounded-sm px-0.5",
        TASK_PLAY_BODY_TEXT,
        "border transition-colors",
        selected
          ? "border-primary/30 bg-primary/10"
          : "border-b border-dashed border-transparent hover:border-primary/45 hover:bg-primary/5",
        "focus-visible:rounded-md focus-visible:border-primary/45 focus-visible:bg-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {text}
    </button>
  );
}
