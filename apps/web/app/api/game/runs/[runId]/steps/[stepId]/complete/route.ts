import { requireSessionAccount } from "@/lib/require-session";
import { completeQuestStepTask } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

/** Reject oversized bodies (attempt payloads must stay small). */
const maxCompleteBodyChars = 256 * 1024;

const paramsSchema = z.object({
  runId: z.string().uuid(),
  stepId: z.string().uuid(),
});

const completeOptionalBodySchema = z.object({
  evaluationGateToken: z.string().uuid().optional(),
  attempt: z.unknown().optional(),
});

type RouteContext = { params: Promise<{ runId: string; stepId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_complete_step:ip:${ip}`, 120, 60_000)) {
    return jsonError(429, "Too many requests", "RATE_LIMIT_IP");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  if (!checkRateLimit(`game_complete_step:acct:${session.accountId}`, 120, 60_000)) {
    return jsonError(429, "Too many completions for this session", "RATE_LIMIT_ACCOUNT");
  }

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "Invalid request");
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength != null) {
    const n = Number(contentLength);
    if (Number.isFinite(n) && n > maxCompleteBodyChars) {
      return jsonError(413, "Request body too large", "BODY_TOO_LARGE");
    }
  }

  const bodyText = await request.text();
  if (bodyText.length > maxCompleteBodyChars) {
    return jsonError(413, "Request body too large", "BODY_TOO_LARGE");
  }

  let evaluationGateToken: string | undefined;
  let attempt: unknown | undefined;

  const trimmedBody = bodyText.trim();
  if (trimmedBody.length > 0) {
    let jsonBody: unknown;
    try {
      jsonBody = JSON.parse(trimmedBody);
    } catch {
      return jsonError(400, "Invalid JSON body");
    }

    const bodyParsed = completeOptionalBodySchema.safeParse(jsonBody);
    if (!bodyParsed.success) {
      return jsonError(400, "Invalid body payload");
    }
    evaluationGateToken = bodyParsed.data.evaluationGateToken;
    attempt = bodyParsed.data.attempt;
  }

  const result = await completeQuestStepTask(session.accountId, parsed.data.runId, parsed.data.stepId, {
    evaluationGateToken,
    attempt,
  });
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
