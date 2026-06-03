"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeaderboardDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type LeaderboardViewProps = {
  data: LeaderboardDto;
  onRefresh?: () => void;
  refreshing?: boolean;
};

function teamLabel(team: "blue" | "red") {
  return team === "blue" ? "Squadra Blu" : "Squadra Rossa";
}

function LeaderboardRank({ rank }: { rank: number }) {
  return (
    <span className="justify-self-center text-xl font-bold tabular-nums leading-none">#{rank}</span>
  );
}

function leaderboardRowClassName(isSelf?: boolean) {
  return cn(
    "grid min-h-14 grid-cols-[3rem_1fr_auto] items-center gap-x-4 rounded-xl border border-border bg-background/80 px-4 py-4 text-lg",
    isSelf && "border-primary/40 bg-primary/5",
  );
}

export function LeaderboardView({ data, onRefresh, refreshing }: LeaderboardViewProps) {
  return (
    <Tabs defaultValue="overall" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="!h-12 gap-1 p-1">
          <TabsTrigger value="overall" className="!h-10 px-4 text-base">
            Individuale
          </TabsTrigger>
          <TabsTrigger value="teams" className="!h-10 px-4 text-base">
            Squadre
          </TabsTrigger>
        </TabsList>
        {onRefresh ? (
          <Button
            type="button"
            size="icon-lg"
            variant="outline"
            aria-label={refreshing ? "Aggiornamento in corso" : "Aggiorna"}
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("size-6 stroke-[2.75]", refreshing && "animate-spin")}
              aria-hidden
            />
          </Button>
        ) : null}
      </div>
      <TabsContent value="overall" className="space-y-3 text-base">
        {data.overall.map((row) => (
          <div key={`${row.rank}:${row.username}`} className={leaderboardRowClassName(row.isSelf)}>
            <LeaderboardRank rank={row.rank} />
            <span className="min-w-0 truncate font-medium">
              {row.username}
              {row.isSelf ? <span className="font-normal text-muted-foreground"> (Tu)</span> : null}
            </span>
            <span className="shrink-0 text-right text-base text-muted-foreground tabular-nums">
              🍕 {row.totalSlices} · 🎒 {row.totalBackpackPieces}%
            </span>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="teams" className="space-y-3 text-base">
        {data.teams.map((row) => (
          <div key={`${row.rank}:${row.team}`} className={leaderboardRowClassName()}>
            <LeaderboardRank rank={row.rank} />
            <span className="min-w-0 truncate font-medium">{teamLabel(row.team)}</span>
            <span className="shrink-0 text-right text-base text-muted-foreground tabular-nums">
              🍕 {row.totalSlices}
            </span>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
