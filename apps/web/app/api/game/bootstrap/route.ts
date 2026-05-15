import { requireSessionAccount } from "@/lib/require-session";
import { bootstrapGameState } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_bootstrap:${ip}`, 60, 60_000)) {
    return jsonError(429, "Too many requests");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const result = await bootstrapGameState(session.accountId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk({
    totalSlices: result.totalSlices,
    levels: result.levels,
    ...(result.activeRun ? { activeRun: result.activeRun } : {}),
  });
}
