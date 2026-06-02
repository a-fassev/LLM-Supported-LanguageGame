"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeaderboardDto } from "@/lib/api-client";

type LeaderboardViewProps = {
  data: LeaderboardDto;
};

function teamLabel(team: "blue" | "red") {
  return team === "blue" ? "Squadra Blu" : "Squadra Rossa";
}

export function LeaderboardView({ data }: LeaderboardViewProps) {
  return (
    <Tabs defaultValue="overall" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overall">Individuale</TabsTrigger>
        <TabsTrigger value="teams">Squadre</TabsTrigger>
      </TabsList>
      <TabsContent value="overall" className="space-y-2">
        {data.overall.map((row) => (
          <div
            key={`${row.rank}:${row.username}`}
            className="flex items-center justify-between rounded-lg border border-border bg-background/80 px-3 py-2 text-sm"
          >
            <span>
              #{row.rank} {row.username} {row.isSelf ? "(Tu)" : ""}
            </span>
            <span>
              🍕 {row.totalSlices} • 🎒 {row.totalBackpackPieces}%
            </span>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="teams" className="space-y-2">
        {data.teams.map((row) => (
          <div
            key={`${row.rank}:${row.team}`}
            className="flex items-center justify-between rounded-lg border border-border bg-background/80 px-3 py-2 text-sm"
          >
            <span>
              #{row.rank} {teamLabel(row.team)}
            </span>
            <span>
              🍕 {row.totalSlices} • Membri: {row.memberCount}
            </span>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
}
