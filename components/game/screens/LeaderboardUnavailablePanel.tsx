"use client";

import { cn } from "@/lib/utils";

type LeaderboardUnavailablePanelProps = {
  message: string;
  className?: string;
};

export function LeaderboardUnavailablePanel({
  message,
  className,
}: LeaderboardUnavailablePanelProps) {
  return (
    <section
      aria-labelledby="leaderboard-unavailable-title"
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-border bg-background/80 px-6 py-10 text-center",
        className,
      )}
    >
      <h2
        id="leaderboard-unavailable-title"
        className="text-xl font-semibold text-foreground sm:text-2xl"
      >
        {message}
      </h2>
    </section>
  );
}
