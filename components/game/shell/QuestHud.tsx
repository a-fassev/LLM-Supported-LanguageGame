import { Backpack, Pizza } from "lucide-react";

type QuestHudProps = {
  totalSlices: number;
  totalBackpackPieces: number;
};

export function QuestHud({ totalSlices, totalBackpackPieces }: QuestHudProps) {
  return (
    <div className="game-panel flex items-center gap-3 px-3 py-2 text-sm font-medium">
      <div className="flex items-center gap-1.5">
        <Pizza className="h-4 w-4" />
        <span>{totalSlices}</span>
      </div>
      <div className="h-5 w-px bg-border/80" />
      <div className="flex items-center gap-1.5">
        <Backpack className="h-4 w-4" />
        <span>{totalBackpackPieces}%</span>
      </div>
    </div>
  );
}
