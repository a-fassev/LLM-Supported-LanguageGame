/** Learner-facing Italian copy for the post-Controlla success / retry overlay. */

export type TaskOutcomeDto = {
  kind: "success" | "retry";
  ratio: number;
  awardedSlices: number;
  awardedBackpackPieces: number;
  headline: string;
  body: string;
};

function percentLabel(ratio: number): string {
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return `${pct}%`;
}

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

function successBody(ratio: number, slices: number, backpackPieces: number): string {
  const praise =
    ratio >= 1 - 1e-9
      ? "Hai fatto centro - complimenti!"
      : ratio >= 0.85
        ? "Che bel risultato!"
        : "Hai superato l'attivita.";
  return `${praise} ${rewardLine(slices, backpackPieces)}`;
}

function retryHeadline(): string {
  return "Quasi!";
}

function retryBody(ratio: number): string {
  return `Hai risposto correttamente al ${percentLabel(ratio)} - per le fette di pizza serve un po' di piu. Riprova, ce la puoi fare!`;
}

export function buildTaskOutcome(params: {
  passed: boolean;
  ratio: number;
  awardedSlices: number;
  awardedBackpackPieces: number;
}): TaskOutcomeDto {
  const ratio = Math.min(1, Math.max(0, params.ratio));
  if (params.passed) {
    return {
      kind: "success",
      ratio,
      awardedSlices: params.awardedSlices,
      awardedBackpackPieces: params.awardedBackpackPieces,
      headline: successHeadline(ratio),
      body: successBody(ratio, params.awardedSlices, params.awardedBackpackPieces),
    };
  }
  return {
    kind: "retry",
    ratio,
    awardedSlices: 0,
    awardedBackpackPieces: 0,
    headline: retryHeadline(),
    body: retryBody(ratio),
  };
}
