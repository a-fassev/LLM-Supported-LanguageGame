"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BootstrapQuestDto } from "@/lib/api-client";

type QuestListItem = {
  quest: BootstrapQuestDto;
  locked: boolean;
  completed: boolean;
};

type QuestListProps = {
  items: QuestListItem[];
  onStartQuest: (questId: string) => void;
};

export function QuestList({ items, onStartQuest }: QuestListProps) {
  return (
    <div className="space-y-5">
      {items.map(({ quest, locked, completed }) => {
        const playable = !locked && !completed;

        return (
          <button
            key={quest.id}
            type="button"
            onClick={() => playable && onStartQuest(quest.id)}
            disabled={!playable}
            aria-label={
              completed
                ? `${quest.title}, missione completata`
                : locked
                  ? `${quest.title}, missione bloccata`
                  : quest.title
            }
            className={cn(
              "game-panel flex min-h-16 w-full items-center justify-between gap-4 p-5 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
              playable && "cursor-pointer hover:opacity-90",
              !playable && "cursor-not-allowed",
              locked && !completed && "opacity-60",
            )}
          >
            <h2 className="min-w-0 flex-1 text-xl font-bold leading-tight tracking-tight md:text-2xl">
              {quest.title}
            </h2>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {completed ? <Badge variant="secondary">Completata</Badge> : null}
              {locked && !completed ? <Badge variant="outline">Bloccata</Badge> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
