import { requireSessionAccount } from "@/lib/require-session";
import { startOrResumeQuest } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  questId: z.string().uuid(),
});

type RouteContext = { params: Promise<{ questId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_start_quest:${ip}`, 40, 60_000)) {
    return jsonError(429, "Too many requests");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "Invalid quest id");
  }

  const result = await startOrResumeQuest(session.accountId, parsed.data.questId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk({
    runId: result.runId,
    chapterId: result.chapterId,
    questId: result.questId,
    questSlug: result.questSlug,
    displayName: result.displayName,
    totalSlices: result.totalSlices,
    totalBackpackPieces: result.totalBackpackPieces,
    steps: result.steps,
    currentStepOrderIndex: result.currentStepOrderIndex,
    currentTaskOrderIndex: result.currentTaskOrderIndex,
  });
}
