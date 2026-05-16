import { requireSessionAccount } from "@/lib/require-session";
import { completeQuestStepTask } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  runId: z.string().uuid(),
  stepId: z.string().uuid(),
});

type RouteContext = { params: Promise<{ runId: string; stepId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_complete_step:${ip}`, 120, 60_000)) {
    return jsonError(429, "Too many requests");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "Invalid request");
  }

  const result = await completeQuestStepTask(session.accountId, parsed.data.runId, parsed.data.stepId);
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
  });
}
