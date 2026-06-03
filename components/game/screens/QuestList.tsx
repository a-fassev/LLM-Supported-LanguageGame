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
      {items.map(({ quest, locked, completed }) => (
        <button
          key={quest.id}
          type="button"
          onClick={() => onStartQuest(quest.id)}
          disabled={locked}
          className={cn(
            "game-panel flex min-h-16 w-full items-center justify-between gap-4 p-5 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            locked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-90",
          )}
        >
          <h2 className="min-w-0 flex-1 text-xl font-bold leading-tight tracking-tight md:text-2xl">
            {quest.title}
          </h2>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {completed ? <Badge>Completata</Badge> : null}
            {locked ? <Badge variant="outline">Bloccata</Badge> : null}
          </div>
        </button>
      ))}
    </div>
  );
}
