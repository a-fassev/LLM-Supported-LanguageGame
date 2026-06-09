import { requireSessionAccount } from "@/lib/require-session";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";
import { startOrResumeRun } from "@/lib/game/services/game-progress-service";
import { walletSnapshotJson } from "@/lib/game/wallet-snapshot-json";

export const runtime = "nodejs";

type StartRunBody = {
  chapterId?: unknown;
  questId?: unknown;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_runs_start:${ip}`, 40, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  let body: StartRunBody;
  try {
    body = (await request.json()) as StartRunBody;
  } catch {
    return jsonError(400, routeMsg.invalidJson);
  }

  const chapterId = typeof body.chapterId === "string" ? body.chapterId.trim() : "";
  const questId = typeof body.questId === "string" ? body.questId.trim() : "";
  if (!chapterId || !questId) {
    return jsonError(400, routeMsg.invalidBody);
  }

  const result = await startOrResumeRun(session.accountId, chapterId, questId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code, result.details);
  }

  return jsonOk({
    ...walletSnapshotJson(result),
    run: result.run,
  });
}
