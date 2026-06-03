"use client";

import { cn } from "@/lib/utils";

type ErrorSpottingChipProps = {
  text: string;
  hint?: string;
  disabled?: boolean;
  onToggle: () => void;
};

export function ErrorSpottingChip({ text, hint, disabled, onToggle }: ErrorSpottingChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={hint}
      onClick={onToggle}
      className={cn(
        "inline max-w-full cursor-pointer rounded-sm px-0.5 text-sm leading-relaxed",
        "border-b border-dashed border-transparent",
        "transition-colors",
        "hover:border-primary/45 hover:bg-primary/5",
        "focus-visible:rounded-md focus-visible:border-primary/45 focus-visible:bg-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {text}
    </button>
  );
}
