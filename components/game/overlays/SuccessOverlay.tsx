"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TaskOutcomeDto } from "@/lib/api-client";

type SuccessOverlayProps = {
  open: boolean;
  outcome: TaskOutcomeDto | null;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
};

export function SuccessOverlay({ open, outcome, onOpenChange, onContinue }: SuccessOverlayProps) {
  if (!outcome) return null;

  const primaryLabel = outcome.kind === "success" ? "Avanti" : "Riprova";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{outcome.headline}</DialogTitle>
          <DialogDescription>{outcome.body}</DialogDescription>
        </DialogHeader>
        <div className="game-panel flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <span>🍕 +{outcome.awardedSlices}</span>
          <span>🎒 +{outcome.awardedBackpackPieces}</span>
          <span>{Math.round(outcome.ratio * 100)}%</span>
        </div>
        <DialogFooter>
          <Button onClick={onContinue}>{primaryLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
