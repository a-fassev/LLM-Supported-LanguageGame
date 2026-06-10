import { requireSessionAccount } from "@/lib/require-session";
import { addRoomTestSlices } from "@/lib/game/services/room-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_room_test_pizza:${ip}`, 20, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const result = await addRoomTestSlices(session.accountId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk(result);
}
