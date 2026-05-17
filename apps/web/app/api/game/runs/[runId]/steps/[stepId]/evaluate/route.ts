import { evaluateFreitextLlmQuestStep } from "@/lib/game/services/game-progress-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, jsonError, jsonOk } from "@/lib/http";
import { requireSessionAccount } from "@/lib/require-session";
import { z } from "zod";

export const runtime = "nodejs";

const paramsSchema = z.object({
  runId: z.string().uuid(),
  stepId: z.string().uuid(),
});

const evaluateBodySchema = z.object({
  answerText: z.string().optional().default(""),
});

type RouteContext = { params: Promise<{ runId: string; stepId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`game_evaluate_freitext:${ip}`, 180, 60_000)) {
    return jsonError(429, "Too many evaluation requests");
  }

  const session = await requireSessionAccount(request);
  if (!session.ok) return session.response;

  const raw = await context.params;
  const parsedParams = paramsSchema.safeParse(raw);
  if (!parsedParams.success) {
    return jsonError(400, "Invalid request");
  }

  let bodyJson: unknown = {};
  try {
    bodyJson = await request.json();
  } catch {
    bodyJson = {};
  }

  const parsedBody = evaluateBodySchema.safeParse(bodyJson);
  if (!parsedBody.success) {
    return jsonError(400, "Invalid JSON payload");
  }

  const result = await evaluateFreitextLlmQuestStep(
    session.accountId,
    parsedParams.data.runId,
    parsedParams.data.stepId,
    parsedBody.data.answerText,
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
