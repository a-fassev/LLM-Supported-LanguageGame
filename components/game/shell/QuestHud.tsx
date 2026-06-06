import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuestHudProps = {
  totalSlices: number;
  totalBackpackPieces: number;
};

export function QuestHud({ totalSlices, totalBackpackPieces }: QuestHudProps) {
  return (
    <div
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "pointer-events-none cursor-default select-none bg-[#fbf0dc] text-[#5a2612]",
      )}
      role="group"
      aria-label="Pizza e zaino"
    >
      <div className="flex items-center gap-2">
        <Image
          src="/content-assets/hubs/status/pizza-svgrepo-com.svg"
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
        />
        <span className="tabular-nums">{totalSlices}</span>
      </div>
      <div className="h-6 w-px bg-border/80" aria-hidden />
      <div className="flex items-center gap-2">
        <Image
          src="/content-assets/hubs/status/backpack-svgrepo-com.svg"
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
        />
        <span className="tabular-nums">{totalBackpackPieces}%</span>
      </div>
    </div>
  );
}
