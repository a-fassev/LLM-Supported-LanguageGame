import { requireSessionAccount } from "@/lib/require-session";
import { finishGameRun } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  runId: z.string().uuid(),
});

type RouteContext = { params: Promise<{ runId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_finish:${ip}`, 60, 60_000)) {
    return jsonError(429, "Too many requests");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "Invalid run id");
  }

  const result = await finishGameRun(session.accountId, parsed.data.runId);
  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk({
    totalSlices: result.totalSlices,
    totalBackpackPieces: result.totalBackpackPieces,
  });
}
