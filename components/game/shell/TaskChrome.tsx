import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TASK_PLAY_INSTRUCTION_TEXT } from "@/lib/game/task-typography";

/** Vertical rhythm between instruction, task body, and chrome footer. */
const TASK_CHROME_GAP = "gap-2";

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
  const intro = instructions?.trim();

  return (
    <section className={`flex h-full min-h-0 w-full flex-col overflow-hidden ${TASK_CHROME_GAP}`}>
      {intro ? (
        <p className={cn("shrink-0", TASK_PLAY_INSTRUCTION_TEXT)}>{intro}</p>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      <footer className={`flex shrink-0 items-center justify-between ${TASK_CHROME_GAP}`}>
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
      </footer>
    </section>
  );
}
