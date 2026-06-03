import { buildTaskOutcome, type TaskOutcomeDto } from "@/lib/game/task-outcome-messages";

/** Feedback strings are normalized in `evaluateFreitextLlmScene` before retry assembly. */
export function buildFreitextRetryTaskOutcome(params: {
  ratio: number;
  summaryFeedback: string;
  nextStepAdvice?: string;
}): TaskOutcomeDto {
  const base = buildTaskOutcome({
    passed: false,
    ratio: params.ratio,
    awardedSlices: 0,
    awardedBackpackPieces: 0,
  });

  const summary = params.summaryFeedback.trim();
  const advice = params.nextStepAdvice?.trim();
  const body = advice && advice.length > 0 ? `${summary} ${advice}` : summary;

  return { ...base, body: body.length > 0 ? body : base.body };
}
