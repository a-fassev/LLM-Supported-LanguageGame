import { cn } from "@/lib/utils";

type CenteredCardProps = {
  className?: string;
  children: React.ReactNode;
};

export function CenteredCard({ className, children }: CenteredCardProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full items-center px-4 py-8">
      <div className={cn("game-panel game-centered-column", className)}>{children}</div>
    </div>
  );
}
