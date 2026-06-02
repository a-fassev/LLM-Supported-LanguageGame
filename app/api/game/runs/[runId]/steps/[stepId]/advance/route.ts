import { requireSessionAccount } from "@/lib/require-session";
import { advanceQuestCutscene } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  runId: z.string().uuid(),
  stepId: z.string().uuid(),
});

type RouteContext = { params: Promise<{ runId: string; stepId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const ip = getClientIp(_request);
  if (!checkRateLimit(`game_advance_cutscene:${ip}`, 120, 60_000)) {
    return jsonError(429, routeMsg.tooManyRequests);
  }

  const session = await requireSessionAccount(_request);
  if (!session.ok) return session.response;

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, routeMsg.invalidRequest);
  }

  const result = await advanceQuestCutscene(session.accountId, parsed.data.runId, parsed.data.stepId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk({
    awardedSlices: result.awardedSlices,
    awardedBackpackPieces: result.awardedBackpackPieces,
    totalSlices: result.totalSlices,
    totalBackpackPieces: result.totalBackpackPieces,
    questComplete: result.questComplete,
    currentStepOrderIndex: result.currentStepOrderIndex,
    currentTaskOrderIndex: result.currentTaskOrderIndex,
    nextTaskStepId: result.nextTaskStepId ?? "",
    taskItemsCorrect: result.taskItemsCorrect,
    taskItemsTotal: result.taskItemsTotal,
  });
}
