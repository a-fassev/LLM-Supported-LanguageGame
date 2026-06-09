import { requireSessionAccount } from "@/lib/require-session";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";
import { getRunSnapshot } from "@/lib/game/services/game-progress-service";
import { walletSnapshotJson } from "@/lib/game/wallet-snapshot-json";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_runs_snapshot:${ip}`, 120, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const result = await getRunSnapshot(session.accountId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code, result.details);
  }

  return jsonOk({
    ...walletSnapshotJson(result),
    run: result.run,
  });
}
