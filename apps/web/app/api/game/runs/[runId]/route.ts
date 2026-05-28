import { requireSessionAccount } from "@/lib/require-session";
import { getGameRun } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  runId: z.string().uuid(),
});

type RouteContext = { params: Promise<{ runId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_run_get:${ip}`, 120, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, routeMsg.invalidRunId);
  }

  const result = await getGameRun(session.accountId, parsed.data.runId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code, result.details);
  }

  return jsonOk({
    runId: result.runId,
    chapterId: result.chapterId,
    questId: result.questId,
    questSlug: result.questSlug,
    displayName: result.displayName,
    status: result.status,
    totalSlices: result.totalSlices,
    totalBackpackPieces: result.totalBackpackPieces,
    steps: result.steps,
    currentStepOrderIndex: result.currentStepOrderIndex,
    currentTaskOrderIndex: result.currentTaskOrderIndex,
  });
}
