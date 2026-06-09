"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { TASK_PLAY_PROMPT_TEXT } from "@/lib/game/task-typography";

type TaskBodyLayoutProps = {
  /** Per-question or task-level prompt (`content.task.prompt`); fixed above the scroll area. */
  prompt?: string | null;
  /** Fixed lines between prompt and scroll area (errors, progress, hints). */
  beforeScroll?: ReactNode;
  /** Main exercise UI; only this region scrolls when content overflows. */
  children: ReactNode | ((promptLabelId: string) => ReactNode);
  /** When true, children fill the remaining height (e.g. full-height freetext textarea). */
  fillScroll?: boolean;
};

/**
 * Shared task body shell for all task types: prompt (normal) + optional meta + scrollable content.
 * Pair with TaskChrome instruction (bold) for the scene-level copy hierarchy.
 */
export function TaskBodyLayout({ prompt, beforeScroll, children, fillScroll }: TaskBodyLayoutProps) {
  const promptLabelId = useId();
  const promptText = prompt?.trim();
  const usesRenderProp = typeof children === "function";
  const groupLabelled = Boolean(promptText) || usesRenderProp;

  const scrollContent = usesRenderProp ? children(promptLabelId) : children;

  return (
    <div
      role={groupLabelled ? "group" : undefined}
      aria-labelledby={groupLabelled ? promptLabelId : undefined}
      className={cn("flex min-h-0 min-w-0 flex-col gap-2", fillScroll ? "h-full" : "h-auto")}
    >
      {promptText ? (
        <p id={promptLabelId} className={cn("shrink-0", TASK_PLAY_PROMPT_TEXT)}>
          {promptText}
        </p>
      ) : usesRenderProp ? (
        <span id={promptLabelId} className="sr-only">
          Attività
        </span>
      ) : null}
      {beforeScroll}
      <div
        className={cn(
          "min-h-0",
          fillScroll
            ? "scrollbar-hide flex flex-1 flex-col overflow-hidden overflow-x-hidden overscroll-y-contain"
            : "shrink-0 overflow-visible",
        )}
      >
        {scrollContent}
      </div>
    </div>
  );
}
