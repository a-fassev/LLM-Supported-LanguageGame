import { parseFreitextEvaluateBody } from "@/lib/game/http/parseFreitextEvaluateBody";
import { evaluateFreitextLlmQuestStep } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { apiRouteMessages as routeMsg } from "@/lib/game/clientMessages";
import { requireSessionAccount } from "@/lib/require-session";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  runId: z.string().uuid(),
  stepId: z.string().uuid(),
});

type RouteContext = { params: Promise<{ runId: string; stepId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_evaluate_freitext:ip:${ip}`, 180, 60_000)) {
    return jsonError(429, routeMsg.tooManyEvaluationRequests, "RATE_LIMIT_IP");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  if (!checkRateLimit(`game_evaluate_freitext:acct:${session.accountId}`, 45, 60_000)) {
    return jsonError(429, routeMsg.tooManyEvaluations, "RATE_LIMIT_ACCOUNT");
  }

  const raw = await context.params;
  const parsedParams = paramsSchema.safeParse(raw);
  if (!parsedParams.success) {
    return jsonError(400, routeMsg.invalidRequest);
  }

  const bodyText = await request.text();
  const parsedBody = parseFreitextEvaluateBody(bodyText);
  if (!parsedBody.ok) {
    return jsonError(400, parsedBody.message, parsedBody.code);
  }

  const result = await evaluateFreitextLlmQuestStep(
    session.accountId,
    parsedParams.data.runId,
    parsedParams.data.stepId,
    parsedBody.answerText,
  );

  if (!result.ok) {
    return jsonError(result.status, result.error, result.code);
  }

  return jsonOk({
    isPass: result.isPass,
    weightedScore: result.weightedScore,
    grammarScore: result.grammarScore,
    vocabularyScore: result.vocabularyScore,
    registerScore: result.registerScore,
    grammarFeedback: result.grammarFeedback,
    vocabularyFeedback: result.vocabularyFeedback,
    registerFeedback: result.registerFeedback,
    summaryFeedback: result.summaryFeedback,
    nextStepAdvice: result.nextStepAdvice,
    scoreEarned: result.scoreEarned,
    scoreMax: result.scoreMax,
    evaluationGateToken: result.evaluationGateToken ?? "",
  });
}
