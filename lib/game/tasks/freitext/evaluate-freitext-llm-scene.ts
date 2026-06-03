import {
  gameClientMessages as msg,
  scoringClientMessages as scoreMsg,
} from "@/lib/game/clientMessages";
import { countWordsAnswer, parseFreitextLlmStepContent } from "@/lib/llm/freitextLlmContentSchema";
import { resolveFreitextLlmEvaluatorEnv } from "@/lib/llm/freitextLlmEnv";
import {
  invokeFreitextLlmJudge,
  mapFreitextLlmProviderError,
  normalizeFeedbackForLearner,
  weightedSkillRatio,
} from "@/lib/llm/freitextLlmEvaluationService";
import { parseFreitextAttempt } from "@/lib/game/tasks/freitext/build-freitext-attempt";
import { mergeFreitextSceneContent } from "@/lib/game/tasks/freitext/merge-freitext-scene-content";
import {
  FREITEXT_ABSOLUTE_MAX_CHARACTERS,
  freitextAnswerTooLongMessage,
  freitextAnswerTooManyCharactersMessage,
  freitextAnswerTooShortMessage,
} from "@/lib/game/tasks/freitext/freitext-messages";

export type FreitextJudgeFeedback = {
  summaryFeedback: string;
  nextStepAdvice?: string;
};

export type EvaluateFreitextLlmSceneResult =
  | { ok: true; ratio: number; feedback: FreitextJudgeFeedback }
  | { ok: false; status: number; error: string; code: string };

export type FreitextSceneContentInput = {
  task: Record<string, unknown>;
  instruction?: string | null;
  /** Scene shell `content.referenceDocument` when not duplicated on the task payload. */
  referenceDocument?: unknown;
};

export async function evaluateFreitextLlmScene(
  content: FreitextSceneContentInput,
  attemptRaw: unknown,
): Promise<EvaluateFreitextLlmSceneResult> {
  const parsedAttempt = parseFreitextAttempt(attemptRaw);
  if (!parsedAttempt.ok) {
    return {
      ok: false,
      status: 400,
      error: scoreMsg.invalidTaskAttemptPayload,
      code: "attempt_invalid",
    };
  }

  const trimmed = parsedAttempt.answerText.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      status: 400,
      error: msg.freitextAnswerEmpty,
      code: "answer_empty",
    };
  }

  if (trimmed.length > FREITEXT_ABSOLUTE_MAX_CHARACTERS) {
    return {
      ok: false,
      status: 400,
      error: freitextAnswerTooManyCharactersMessage(),
      code: "answer_too_long",
    };
  }

  const merged = mergeFreitextSceneContent(
    content.task,
    content.instruction,
    content.referenceDocument,
  );
  const payload = parseFreitextLlmStepContent(merged);
  if (!payload.ok) {
    return {
      ok: false,
      status: 502,
      error: msg.freitextPayloadInvalid,
      code: "payload_invalid",
    };
  }

  const minW = payload.value.minWords ?? 0;
  const maxW = payload.value.maxWords ?? 0;
  const words = countWordsAnswer(trimmed);

  if (minW > 0 && words < minW) {
    return {
      ok: false,
      status: 400,
      error: freitextAnswerTooShortMessage(minW),
      code: "answer_too_short",
    };
  }

  if (maxW > 0 && words > maxW) {
    return {
      ok: false,
      status: 400,
      error: freitextAnswerTooLongMessage(maxW),
      code: "answer_too_long",
    };
  }

  const env = resolveFreitextLlmEvaluatorEnv();
  if (!env) {
    return {
      ok: false,
      status: 503,
      error: msg.llmNotConfigured,
      code: "evaluator_unavailable",
    };
  }

  const controller = new AbortController();
  const timer =
    env.llmTimeoutMs > 0
      ? setTimeout(() => controller.abort(), Math.max(1000, env.llmTimeoutMs))
      : null;

  try {
    const modelOut = await invokeFreitextLlmJudge(payload.value, trimmed, env, controller.signal);
    const ratio = weightedSkillRatio(payload.value.evaluation, {
      grammarScore: modelOut.grammarScore,
      vocabularyScore: modelOut.vocabularyScore,
      registerScore: modelOut.registerScore,
      taskFulfillmentScore: modelOut.taskFulfillmentScore,
    });

    return {
      ok: true,
      ratio: Math.max(0, Math.min(1, ratio)),
      feedback: {
        summaryFeedback: normalizeFeedbackForLearner(modelOut.summaryFeedback, 520),
        nextStepAdvice: modelOut.nextStepAdvice?.trim()
          ? normalizeFeedbackForLearner(modelOut.nextStepAdvice, 120)
          : undefined,
      },
    };
  } catch (err) {
    const abortedBySignal = controller.signal.aborted;
    const abortByName =
      (err instanceof Error && err.name === "AbortError") ||
      (typeof err === "object" &&
        err !== null &&
        "name" in err &&
        typeof (err as { name?: unknown }).name === "string" &&
        (err as { name: string }).name === "AbortError");

    if (abortedBySignal || abortByName) {
      return {
        ok: false,
        status: 504,
        error: msg.modelTimedOut,
        code: "MODEL_TIMEOUT",
      };
    }

    const mapped = mapFreitextLlmProviderError(err);
    if (mapped) {
      return {
        ok: false,
        status: mapped.status,
        error: mapped.message,
        code: mapped.code,
      };
    }

    console.error("[evaluateFreitextLlmScene]", err);
    return {
      ok: false,
      status: 503,
      error: msg.freitextEvaluatorError,
      code: "EVALUATOR_ERROR",
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
