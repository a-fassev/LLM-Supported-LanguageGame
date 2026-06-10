import { requireSessionAccount } from "@/lib/require-session";
import { getRoomState } from "@/lib/game/services/room-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_room:${ip}`, 60, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const result = await getRoomState(session.accountId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk(result);
}
