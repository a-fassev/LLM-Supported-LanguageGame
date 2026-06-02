import { Button } from "@/components/ui/button";

type TaskChromeProps = {
  instructions?: string;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  children: React.ReactNode;
};

export function TaskChrome({
  instructions,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  children,
}: TaskChromeProps) {
  return (
    <section className="mx-auto mt-24 w-full max-w-5xl px-4 pb-8">
      <div className="game-panel flex flex-col gap-4 p-4 md:p-6">
        <div className="game-panel px-3 py-2 text-sm md:text-base">
          {instructions?.trim() || "Completa l'attività e premi «Controlla»."}
        </div>
        <div className="game-panel min-h-[260px] p-4 md:p-6">{children}</div>
        <div className="flex justify-end">
          <Button onClick={onPrimary} disabled={primaryDisabled}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
