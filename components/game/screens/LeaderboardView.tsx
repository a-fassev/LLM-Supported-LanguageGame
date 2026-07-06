"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeaderboardEligibleDto, LeaderboardTeamDto, TeamColor } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type LeaderboardViewProps = {
  data: LeaderboardEligibleDto;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
};

function teamLabel(team: TeamColor) {
  return team === "blue" ? "Squadra Blu" : "Squadra Rossa";
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
    <section className={cn("flex min-h-0 flex-1 flex-col gap-5", className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Squadre</h2>
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
      <div className="min-h-0 flex-1 overflow-y-auto text-base">
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
      </div>
    </section>
  );
}
