import { cn } from "@/lib/utils";

type CenteredCardProps = {
  className?: string;
  children: React.ReactNode;
};

export function CenteredCard({ className, children }: CenteredCardProps) {
  return (
    <div className="game-shell-inset flex h-dvh w-full items-center">
      <div className={cn("game-panel game-centered-column game-panel-inset", className)}>{children}</div>
    </div>
  );
}
