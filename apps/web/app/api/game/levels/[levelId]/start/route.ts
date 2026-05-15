import { requireSessionAccount } from "@/lib/require-session";
import { startOrResumeLevel } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  levelId: z.string().uuid(),
});

type RouteContext = { params: Promise<{ levelId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_start:${ip}`, 40, 60_000)) {
    return jsonError(429, "Too many requests");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "Invalid level id");
  }

  const result = await startOrResumeLevel(session.accountId, parsed.data.levelId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk({
    runId: result.runId,
    levelId: result.levelId,
    levelSlug: result.levelSlug,
    displayName: result.displayName,
    totalSlices: result.totalSlices,
    tasks: result.tasks,
    currentTaskOrderIndex: result.currentTaskOrderIndex,
  });
}
