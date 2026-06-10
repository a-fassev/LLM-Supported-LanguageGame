import { requireSessionAccount } from "@/lib/require-session";
import { buyRoomItem } from "@/lib/game/services/room-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";

export const runtime = "nodejs";

type PurchaseBody = {
  itemId?: unknown;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_room_purchase:${ip}`, 40, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  let body: PurchaseBody;
  try {
    body = (await request.json()) as PurchaseBody;
  } catch {
    return jsonError(400, routeMsg.invalidJson);
  }

  const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
  if (!itemId) {
    return jsonError(400, routeMsg.invalidBody);
  }

  const result = await buyRoomItem(session.accountId, itemId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk(result);
}
