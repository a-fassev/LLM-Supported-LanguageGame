"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_PLAY_INLINE_FIELD_TEXT } from "@/lib/game/task-typography";
import { ERROR_SPOTTING_CORRECTION_MAX_LENGTH } from "@/lib/game/tasks/error-spotting/error-spotting-types";

type ErrorSpottingInlineFieldProps = {
  value: string;
  segmentText: string;
  hint?: string;
  ariaLabel: string;
  clearLabel: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
};

const APPROX_CHAR_WIDTH_PX = 9;
const INPUT_HORIZONTAL_PADDING_PX = 12;
/** w-4 clear control + trailing margin */
const CLEAR_CONTROL_WIDTH_PX = 20;
/** Extra room so the word is not cramped beside × */
const EXTRA_SLACK_PX = 10;

export function correctionFieldWidth(segmentText: string): number {
  const wordLen = Math.min(segmentText.trim().length, ERROR_SPOTTING_CORRECTION_MAX_LENGTH);
  const textWidth = wordLen * APPROX_CHAR_WIDTH_PX;
  const chrome = INPUT_HORIZONTAL_PADDING_PX + CLEAR_CONTROL_WIDTH_PX + EXTRA_SLACK_PX;
  return Math.min(360, Math.max(56, textWidth + chrome));
}

export function ErrorSpottingInlineField({
  value,
  segmentText,
  hint,
  ariaLabel,
  clearLabel,
  disabled,
  onChange,
  onClear,
}: ErrorSpottingInlineFieldProps) {
  const width = correctionFieldWidth(segmentText);
  const placeholder = segmentText.trim() || undefined;

  return (
    <span
      className={cn(
        "inline-flex h-7 max-w-full min-h-7 items-center align-baseline rounded-sm border border-primary/30 bg-primary/5",
        disabled && "opacity-60",
      )}
      style={{ width: `${width}px` }}
      title={hint}
    >
      <input
        type="text"
        name={`error-spotting-correction-${ariaLabel.replace(/\s+/g, "-").toLowerCase()}`}
        value={value}
        disabled={disabled}
        maxLength={ERROR_SPOTTING_CORRECTION_MAX_LENGTH}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-1p-ignore
        data-lpignore="true"
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClear();
          }
        }}
        className={cn(
          "h-7 min-h-7 min-w-0 flex-1 border-0 bg-transparent px-1.5 py-0",
          TASK_PLAY_INLINE_FIELD_TEXT,
          "outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted-foreground/70",
          "disabled:cursor-not-allowed",
        )}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={clearLabel}
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        className={cn(
          "mr-0.5 inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm",
          "text-muted-foreground/60 transition-colors",
          "hover:text-foreground",
          "focus:outline-none focus-visible:outline-none",
          "disabled:pointer-events-none",
        )}
      >
        <X className="size-2.5" strokeWidth={2} aria-hidden />
      </button>
    </span>
  );
}
