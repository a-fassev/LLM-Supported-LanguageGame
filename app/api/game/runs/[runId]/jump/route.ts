import { requireSessionAccount } from "@/lib/require-session";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";
import { jumpRunScene } from "@/lib/game/services/game-progress-service";
import { walletSnapshotJson } from "@/lib/game/wallet-snapshot-json";

export const runtime = "nodejs";

type JumpBody = {
  sceneId?: unknown;
  targetSceneId?: unknown;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_runs_jump:${ip}`, 120, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const params = await context.params;
  const runId = params.runId?.trim();
  if (!runId) return jsonError(400, routeMsg.invalidRequest);

  let body: JumpBody;
  try {
    body = (await request.json()) as JumpBody;
  } catch {
    return jsonError(400, routeMsg.invalidJson);
  }

  const sceneId = typeof body.sceneId === "string" ? body.sceneId.trim() : "";
  const targetSceneId = typeof body.targetSceneId === "string" ? body.targetSceneId.trim() : "";
  if (!sceneId || !targetSceneId) return jsonError(400, routeMsg.invalidBody);

  const result = await jumpRunScene(session.accountId, runId, sceneId, targetSceneId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code, result.details);
  }

  return jsonOk({
    ...walletSnapshotJson(result),
    run: result.run,
  });
}
