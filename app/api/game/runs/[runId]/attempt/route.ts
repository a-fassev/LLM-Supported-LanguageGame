import { requireSessionAccount } from "@/lib/require-session";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";
import { completeTaskScene } from "@/lib/game/services/game-progress-service";

export const runtime = "nodejs";

type AttemptBody = {
  sceneId?: unknown;
  attempt?: unknown;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_runs_attempt:${ip}`, 120, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  if (!checkRateLimit(`game_runs_attempt_account:${session.accountId}`, 60, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const params = await context.params;
  const runId = params.runId?.trim();
  if (!runId) return jsonError(400, routeMsg.invalidRequest);

  let body: AttemptBody;
  try {
    body = (await request.json()) as AttemptBody;
  } catch {
    return jsonError(400, routeMsg.invalidJson);
  }

  const sceneId = typeof body.sceneId === "string" ? body.sceneId.trim() : "";
  if (!sceneId) return jsonError(400, routeMsg.invalidBody);

  const result = await completeTaskScene(session.accountId, runId, sceneId, {
    attemptPayload: body.attempt,
  });
  if (!result.ok) {
    const details = {
      ...result.details,
      ...(result.taskOutcome ? { taskOutcome: result.taskOutcome } : {}),
      ...(result.taskReview ? { taskReview: result.taskReview } : {}),
    };
    return jsonError(result.status, result.error, result.code, details);
  }

  return jsonOk({
    totalSlices: result.totalSlices,
    totalBackpackPieces: result.totalBackpackPieces,
    run: result.run,
    ...(result.taskOutcome ? { taskOutcome: result.taskOutcome } : {}),
    ...(result.taskReview ? { taskReview: result.taskReview } : {}),
  });
}
