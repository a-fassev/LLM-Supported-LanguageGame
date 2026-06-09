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
        "mt-4 h-2.5 w-[min(100%,11rem)] max-w-[80%] shrink-0 rounded-full",
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
        "flex h-full min-h-0 flex-col items-center rounded-xl border border-border bg-background/80 px-4 pb-6 pt-10 text-center max-sm:min-h-[min(32rem,52dvh)] max-sm:h-auto md:pt-12",
        highlightSelf && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex w-full shrink-0 flex-col items-center">
        <span className="text-4xl font-bold tabular-nums leading-none md:text-5xl">
          #{teamRow.rank}
        </span>
        <TeamColorBar team={teamRow.team} />
        <p id={titleId} className="mt-5 text-2xl font-semibold leading-tight md:text-3xl">
          {teamLabel(teamRow.team)}
        </p>
        <p className="mt-2 text-xl font-medium tabular-nums text-muted-foreground md:text-2xl">
          🍕 {teamRow.totalSlices}
        </p>
      </div>
      <div className="mt-5 flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="mx-auto mb-5 h-[3px] w-[min(100%,17rem)] max-w-[96%] shrink-0 rounded-full bg-muted-foreground/65"
        />
        {teamRow.members.length > 0 ? (
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-1 py-1">
            {teamRow.members.map((member) => (
              <li
                key={member.username}
                className={cn(
                  "truncate text-base md:text-lg",
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
      </div>
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
      <TabsContent value="teams" className="flex min-h-0 flex-1 flex-col text-base max-sm:overflow-y-auto">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 max-sm:auto-rows-auto sm:grid-cols-2 sm:auto-rows-fr">
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
