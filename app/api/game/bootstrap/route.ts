import { requireSessionAccount } from "@/lib/require-session";
import { bootstrapGameState } from "@/lib/game/services/game-progress-service";
import { walletSnapshotJson } from "@/lib/game/wallet-snapshot-json";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_bootstrap:${ip}`, 60, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const result = await bootstrapGameState(session.accountId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code, result.details);
  }

  return jsonOk({
    ...walletSnapshotJson(result),
    completedQuestIds: result.completedQuestIds,
    chapters: result.chapters,
  });
}
