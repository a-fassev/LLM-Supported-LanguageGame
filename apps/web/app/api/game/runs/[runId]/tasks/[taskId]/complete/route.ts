import { requireSessionAccount } from "@/lib/require-session";
import { completeGameTask } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  runId: z.string().uuid(),
  taskId: z.string().uuid(),
});

type RouteContext = { params: Promise<{ runId: string; taskId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_complete_task:${ip}`, 120, 60_000)) {
    return jsonError(429, "Too many requests");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "Invalid request");
  }

  const result = await completeGameTask(
    session.accountId,
    parsed.data.runId,
    parsed.data.taskId,
  );
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk({
    awardedSlices: result.awardedSlices,
    totalSlices: result.totalSlices,
    levelComplete: result.levelComplete,
    currentTaskOrderIndex: result.currentTaskOrderIndex,
    currentTaskId: result.currentTaskId ?? "",
  });
}
