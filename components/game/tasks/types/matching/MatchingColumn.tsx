"use client";

import { useId } from "react";
import { MatchingCard } from "@/components/game/tasks/types/matching/MatchingCard";
import type { MatchingItemView } from "@/lib/game/tasks/matching/matching-types";

type MatchingColumnProps = {
  header: string;
  side: "left" | "right";
  items: MatchingItemView[];
  disabled?: boolean;
  selectedLeftId?: string | null;
  pairedRightIds: Set<string>;
  pairs: Record<string, string | null>;
  registerRef: (id: string, node: HTMLButtonElement | null) => void;
  onLeftPointerDown?: (leftId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onLeftPointerUp?: (leftId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onLeftKeyDown?: (leftId: string, event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onRightPointerUp?: (rightId: string, event: React.PointerEvent<HTMLButtonElement>) => void;
  onRightKeyDown?: (rightId: string, event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onUnpair?: (leftId: string) => void;
};

export function MatchingColumn({
  header,
  side,
  items,
  disabled,
  selectedLeftId,
  pairedRightIds,
  pairs,
  registerRef,
  onLeftPointerDown,
  onLeftPointerUp,
  onLeftKeyDown,
  onRightPointerUp,
  onRightKeyDown,
  onUnpair,
}: MatchingColumnProps) {
  const headerId = useId();

  return (
    <div className="min-w-0 flex-1">
      <p id={headerId} className="mb-1.5 text-xs font-bold text-foreground">
        {header}
      </p>
      <div role="group" aria-labelledby={headerId} className="flex flex-col gap-2.5">
        {side === "left"
          ? items.map((item) => {
              const pairedRightId = pairs[item.id];
              const paired = Boolean(pairedRightId);
              return (
                <div key={item.id} className="relative w-full">
                  <MatchingCard
                    ref={(node) => registerRef(item.id, node)}
                    id={item.id}
                    label={item.label}
                    side="left"
                    selected={selectedLeftId === item.id}
                    paired={paired}
                    hasTrailingAction={paired}
                    disabled={disabled}
                    onPointerDown={(event) => onLeftPointerDown?.(item.id, event)}
                    onPointerUp={(event) => onLeftPointerUp?.(item.id, event)}
                    onKeyDown={(event) => onLeftKeyDown?.(item.id, event)}
                  />
                  {paired ? (
                    <button
                      type="button"
                      aria-label="Rimuovi collegamento"
                      title="Rimuovi collegamento"
                      disabled={disabled}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onUnpair?.(item.id);
                      }}
                      className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-lg leading-none text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              );
            })
          : items.map((item) => (
              <MatchingCard
                key={item.id}
                ref={(node) => registerRef(item.id, node)}
                id={item.id}
                label={item.label}
                side="right"
                paired={pairedRightIds.has(item.id)}
                disabled={disabled}
                onPointerUp={(event) => onRightPointerUp?.(item.id, event)}
                onKeyDown={(event) => onRightKeyDown?.(item.id, event)}
              />
            ))}
      </div>
    </div>
  );
}
