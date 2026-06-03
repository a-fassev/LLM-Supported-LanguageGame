"use client";

import { useId, type ReactNode } from "react";

type TaskBodyLayoutProps = {
  /** Per-question or task-level prompt (`content.task.prompt`); fixed above the scroll area. */
  prompt?: string | null;
  /** Fixed lines between prompt and scroll area (errors, progress, hints). */
  beforeScroll?: ReactNode;
  /** Main exercise UI; only this region scrolls when content overflows. */
  children: ReactNode | ((promptLabelId: string) => ReactNode);
};

/**
 * Shared task body shell for all task types: prompt (normal) + optional meta + scrollable content.
 * Pair with TaskChrome instruction (bold) for the scene-level copy hierarchy.
 */
export function TaskBodyLayout({ prompt, beforeScroll, children }: TaskBodyLayoutProps) {
  const promptLabelId = useId();
  const promptText = prompt?.trim();
  const usesRenderProp = typeof children === "function";
  const groupLabelled = Boolean(promptText) || usesRenderProp;

  const scrollContent = usesRenderProp ? children(promptLabelId) : children;

  return (
    <div
      role={groupLabelled ? "group" : undefined}
      aria-labelledby={groupLabelled ? promptLabelId : undefined}
      className="flex h-full min-h-0 min-w-0 flex-col gap-2"
    >
      {promptText ? (
        <p id={promptLabelId} className="shrink-0 text-sm font-normal leading-snug text-foreground">
          {promptText}
        </p>
      ) : usesRenderProp ? (
        <span id={promptLabelId} className="sr-only">
          Attività
        </span>
      ) : null}
      {beforeScroll}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">{scrollContent}</div>
    </div>
  );
}
