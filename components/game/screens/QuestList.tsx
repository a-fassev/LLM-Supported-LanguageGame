"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-3">
      {items.map(({ quest, locked, completed }) => (
        <article key={quest.id} className="game-panel flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold">{quest.title}</h2>
            <p className="text-sm text-muted-foreground">{quest.kind === "bonus" ? "Bonus" : "Missione"}</p>
          </div>
          <div className="flex items-center gap-2">
            {completed ? <Badge>Completata</Badge> : null}
            {locked ? <Badge variant="outline">Bloccata</Badge> : null}
            <Button onClick={() => onStartQuest(quest.id)} disabled={locked}>
              Gioca
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
