import { Backpack, Pizza } from "lucide-react";

type QuestHudProps = {
  totalSlices: number;
  totalBackpackPieces: number;
};

export function QuestHud({ totalSlices, totalBackpackPieces }: QuestHudProps) {
  return (
    <div className="game-panel flex h-12 items-center gap-3 px-3 text-base font-medium">
      <div className="flex items-center gap-2">
        <Pizza className="h-5 w-5 shrink-0" aria-hidden />
        <span className="tabular-nums">{totalSlices}</span>
      </div>
      <div className="h-6 w-px bg-border/80" aria-hidden />
      <div className="flex items-center gap-2">
        <Backpack className="h-5 w-5 shrink-0" aria-hidden />
        <span className="tabular-nums">{totalBackpackPieces}%</span>
      </div>
    </div>
  );
}
