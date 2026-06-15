"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeaderboardDto, LeaderboardTeamDto, TeamColor } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type LeaderboardViewProps = {
  data: LeaderboardDto;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
};

function teamLabel(team: TeamColor) {
  return team === "blue" ? "Squadra Blu" : "Squadra Rossa";
}

function TeamColorDot({ team }: { team: TeamColor }) {
  return (
    <span
      className={cn(
        "size-2.5 shrink-0 rounded-full ring-1 ring-border/60",
        team === "blue" ? "bg-(--team-blue)" : "bg-(--team-red)",
      )}
      aria-hidden
    />
  );
}

function TeamColorBar({ team }: { team: TeamColor }) {
  const label = team === "blue" ? "Squadra Blu" : "Squadra Rossa";
  return (
    <span
      className={cn(
        "mt-3 h-2.5 w-[min(100%,11rem)] max-w-[80%] shrink-0 rounded-full sm:mt-4",
        team === "blue" ? "bg-(--team-blue)" : "bg-(--team-red)",
      )}
      role="img"
      aria-label={label}
    />
  );
}

function LeaderboardRank({ rank }: { rank: number }) {
  return (
    <span className="w-10 shrink-0 text-left text-xl font-bold tabular-nums leading-none">
      #{rank}
    </span>
  );
}

function leaderboardRowClassName(isSelf?: boolean) {
  return cn(
    "flex min-h-14 items-center gap-4 rounded-xl border border-border bg-background/80 px-4 py-4 text-lg",
    isSelf && "border-primary/40 bg-primary/5",
  );
}

function findTeamRow(teams: LeaderboardTeamDto[], team: TeamColor): LeaderboardTeamDto {
  const found = teams.find((row) => row.team === team);
  if (found) return found;

  const fallbackRank =
    teams.length > 0 ? Math.max(...teams.map((row) => row.rank)) + 1 : 1;

  return {
    rank: fallbackRank,
    team,
    totalSlices: 0,
    totalBackpackPieces: 0,
    memberCount: 0,
    members: [],
  };
}

function TeamLeaderboardColumn({
  teamRow,
  highlightSelf,
}: {
  teamRow: LeaderboardTeamDto;
  highlightSelf: boolean;
}) {
  const titleId = `leaderboard-team-${teamRow.team}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col items-center rounded-xl border border-border bg-background/80 px-4 pb-5 pt-6 text-center sm:pb-6 sm:pt-8",
        highlightSelf && "border-primary/40 bg-primary/5",
      )}
    >
      <span className="text-3xl font-bold tabular-nums leading-none sm:text-4xl">
        #{teamRow.rank}
      </span>
      <TeamColorBar team={teamRow.team} />
      <p id={titleId} className="mt-4 text-xl font-semibold leading-tight sm:mt-5 sm:text-2xl">
        {teamLabel(teamRow.team)}
      </p>
      <p className="mt-2 text-lg font-medium tabular-nums text-muted-foreground sm:text-xl">
        🍕 {teamRow.totalSlices}
      </p>
      <div
        aria-hidden
        className="mx-auto mt-5 mb-4 h-[3px] w-[min(100%,17rem)] max-w-[96%] rounded-full bg-muted-foreground/65"
      />
      {teamRow.members.length > 0 ? (
        <ul className="w-full space-y-2 px-1">
          {teamRow.members.map((member) => (
            <li
              key={member.username}
              className={cn(
                "truncate text-base sm:text-lg",
                member.isSelf ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {member.username}
              {member.isSelf ? (
                <span className="font-normal text-muted-foreground"> (Tu)</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-muted-foreground">Nessun giocatore</p>
      )}
    </section>
  );
}

export function LeaderboardView({ data, onRefresh, refreshing, className }: LeaderboardViewProps) {
  return (
    <Tabs defaultValue="overall" className={cn("flex min-h-0 flex-1 flex-col gap-5", className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
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
      <TabsContent value="overall" className="min-h-0 flex-1 space-y-3 overflow-y-auto text-base">
        {data.overall.map((row) => (
          <div key={`${row.rank}:${row.username}`} className={leaderboardRowClassName(row.isSelf)}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex shrink-0 items-center gap-0">
                <LeaderboardRank rank={row.rank} />
                <TeamColorDot team={row.team} />
              </div>
              <span className="min-w-0 truncate font-medium">
                {row.username}
                {row.isSelf ? (
                  <span className="font-normal text-muted-foreground"> (Tu)</span>
                ) : null}
              </span>
            </div>
            <span className="shrink-0 text-right text-base text-muted-foreground tabular-nums">
              🍕 {row.totalSlices} · 🎒 {row.backpackProgressPercent}%
            </span>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="teams" className="min-h-0 flex-1 overflow-y-auto text-base">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TeamLeaderboardColumn
            teamRow={findTeamRow(data.teams, "blue")}
            highlightSelf={data.self.team === "blue"}
          />
          <TeamLeaderboardColumn
            teamRow={findTeamRow(data.teams, "red")}
            highlightSelf={data.self.team === "red"}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
