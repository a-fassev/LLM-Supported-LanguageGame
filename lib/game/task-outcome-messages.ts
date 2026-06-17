/** Learner-facing Italian copy for the post-Controlla success overlay. */

export type TaskOutcomeDto = {
  ratio: number;
  awardedSlices: number;
  awardedBackpackPieces: number;
  headline: string;
  body: string;
};

function rewardLine(slices: number, backpackPieces: number): string {
  const parts: string[] = [];
  if (slices > 0) {
    parts.push(slices === 1 ? "1 fetta di pizza" : `${slices} fette di pizza`);
  }
  if (backpackPieces > 0) {
    parts.push(backpackPieces === 1 ? "1 pezzo nello zaino" : `${backpackPieces} pezzi nello zaino`);
  }
  if (parts.length === 0) {
    return "Continua l'avventura!";
  }
  if (parts.length === 1) {
    return `Guadagni ${parts[0]}.`;
  }
  return `Guadagni ${parts[0]} e ${parts[1]}.`;
}

function successHeadline(ratio: number): string {
  if (ratio >= 1 - 1e-9) return "Perfetto!";
  if (ratio >= 0.85) return "Bravissimo!";
  if (ratio >= 0.6) return "Ottimo lavoro!";
  return "Bene! Ce l'hai fatta!";
}

function successBody(
  ratio: number,
  slices: number,
  backpackPieces: number,
  rewardsAlreadyClaimed?: boolean,
): string {
  if (rewardsAlreadyClaimed) {
    return "Hai gia guadagnato le ricompense per questa attivita. Continua l'avventura!";
  }
  const praise =
    ratio >= 1 - 1e-9
      ? "Hai fatto centro - complimenti!"
      : ratio >= 0.85
        ? "Che bel risultato!"
        : ratio >= 0.6
          ? "Ottimo, continua cosi!"
          : "Hai completato l'attivita.";
  return `${praise} ${rewardLine(slices, backpackPieces)}`;
}

function appendFreetextFeedback(
  body: string,
  summaryFeedback?: string,
  nextStepAdvice?: string,
): string {
  const summary = summaryFeedback?.trim();
  const advice = nextStepAdvice?.trim();
  if (!summary && !advice) return body;
  const parts = [summary, advice].filter((part): part is string => Boolean(part && part.length > 0));
  const merged = `${body} ${parts.join(" ")}`.trim();
  return merged;
}

export function buildTaskOutcome(params: {
  ratio: number;
  awardedSlices: number;
  awardedBackpackPieces: number;
  /** Scene was passed again after rewards were already stored for this run/scene. */
  rewardsAlreadyClaimed?: boolean;
  /** Optional freetext judge copy appended to overlay body (summary + short advice). */
  summaryFeedback?: string;
  nextStepAdvice?: string;
}): TaskOutcomeDto {
  const ratio = Math.min(1, Math.max(0, params.ratio));
  const baseBody = successBody(
    ratio,
    params.awardedSlices,
    params.awardedBackpackPieces,
    params.rewardsAlreadyClaimed,
  );
  const freetextBody = appendFreetextFeedback(
    baseBody,
    params.summaryFeedback,
    params.nextStepAdvice,
  );
  return {
    ratio,
    awardedSlices: params.awardedSlices,
    awardedBackpackPieces: params.awardedBackpackPieces,
    headline: successHeadline(ratio),
    body: freetextBody,
  };
}
