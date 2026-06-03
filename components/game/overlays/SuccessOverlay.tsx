"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TaskOutcomeDto } from "@/lib/api-client";

type SuccessOverlayProps = {
  open: boolean;
  outcome: TaskOutcomeDto | null;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  primaryLabel?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  showRewardSummary?: boolean;
};

export function SuccessOverlay({
  open,
  outcome,
  onOpenChange,
  onContinue,
  primaryLabel,
  secondaryAction,
  showRewardSummary = true,
}: SuccessOverlayProps) {
  if (!outcome) return null;

  const defaultPrimary = outcome.kind === "success" ? "Avanti" : "Riprova";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="game-panel max-w-md gap-0 border-0 p-0 shadow-lg ring-0 sm:max-w-md"
      >
        <div className="game-panel-inset flex flex-col gap-5 text-base">
          <DialogHeader className="gap-3 text-left">
            <DialogTitle className="game-hub-header__title text-left">{outcome.headline}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">{outcome.body}</DialogDescription>
          </DialogHeader>
          {showRewardSummary ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-medium">
              <span>🍕 +{outcome.awardedSlices}</span>
              <span>🎒 +{outcome.awardedBackpackPieces}</span>
              <span className="tabular-nums">{Math.round(outcome.ratio * 100)}%</span>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {secondaryAction ? (
              <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            ) : null}
            <Button size="lg" className="w-full sm:w-auto" onClick={onContinue}>
              {primaryLabel ?? defaultPrimary}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
