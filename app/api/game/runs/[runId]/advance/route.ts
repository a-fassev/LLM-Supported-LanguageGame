import { requireSessionAccount } from "@/lib/require-session";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";
import { advanceStoryScene } from "@/lib/game/services/game-progress-service";

export const runtime = "nodejs";

type AdvanceBody = {
  sceneId?: unknown;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_runs_advance:${ip}`, 120, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const params = await context.params;
  const runId = params.runId?.trim();
  if (!runId) return jsonError(400, routeMsg.invalidRequest);

  let body: AdvanceBody;
  try {
    body = (await request.json()) as AdvanceBody;
  } catch {
    return jsonError(400, routeMsg.invalidJson);
  }

  const sceneId = typeof body.sceneId === "string" ? body.sceneId.trim() : "";
  if (!sceneId) return jsonError(400, routeMsg.invalidBody);

  const result = await advanceStoryScene(session.accountId, runId, sceneId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code, result.details);
  }

  return jsonOk({
    totalSlices: result.totalSlices,
    totalBackpackPieces: result.totalBackpackPieces,
    run: result.run,
  });
}
