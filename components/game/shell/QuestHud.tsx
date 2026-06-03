import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Backpack, Pizza } from "lucide-react";

type QuestHudProps = {
  totalSlices: number;
  totalBackpackPieces: number;
};

export function QuestHud({ totalSlices, totalBackpackPieces }: QuestHudProps) {
  return (
    <div
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "pointer-events-none cursor-default select-none",
      )}
      role="group"
      aria-label="Pizza e zaino"
    >
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
