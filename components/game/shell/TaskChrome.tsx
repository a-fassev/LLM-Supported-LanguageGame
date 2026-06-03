import { Button } from "@/components/ui/button";

type TaskChromeProps = {
  instructions?: string;
  primaryLabel: string;
  primaryDisabled?: boolean;
  canRetreat?: boolean;
  retreatDisabled?: boolean;
  retreatLabel?: string;
  onRetreat?: () => void;
  onPrimary: () => void;
  children: React.ReactNode;
};

export function TaskChrome({
  instructions,
  primaryLabel,
  primaryDisabled,
  canRetreat = false,
  retreatDisabled,
  retreatLabel = "Indietro",
  onRetreat,
  onPrimary,
  children,
}: TaskChromeProps) {
  const intro =
    instructions?.trim() || "Completa l'attività e premi «Controlla».";

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto">
      <p className="shrink-0 text-base leading-relaxed md:text-lg">{intro}</p>
      <div className="min-h-[260px] flex-1">{children}</div>
      <div className="flex shrink-0 items-center justify-between gap-3">
        {onRetreat ? (
          <Button size="lg" variant="outline" onClick={onRetreat} disabled={retreatDisabled ?? !canRetreat}>
            {retreatLabel}
          </Button>
        ) : (
          <span />
        )}
        <Button size="lg" onClick={onPrimary} disabled={primaryDisabled}>
          {primaryLabel}
        </Button>
      </div>
    </section>
  );
}
