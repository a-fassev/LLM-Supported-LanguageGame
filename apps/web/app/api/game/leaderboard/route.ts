import { requireSessionAccount } from "@/lib/require-session";
import { getLeaderboardState } from "@/lib/game/services/leaderboard-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_leaderboard:${ip}`, 60, 60_000)) {
    return jsonError(429, "Too many requests");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const result = await getLeaderboardState(session.accountId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk({
    self: result.self,
    overall: result.overall,
    teams: result.teams,
  });
}
