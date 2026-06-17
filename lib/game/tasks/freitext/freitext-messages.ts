/** Learner-facing Italian copy for freitext tasks. */

export const FREITEXT_CONTENT_MISMATCH_MESSAGE =
  "Contenuto attività non valido. Ricarica la pagina o contatta il docente.";

export const FREITEXT_EVALUATING_MESSAGE = "Sto leggendo il tuo testo…";

export const FREITEXT_TEXTAREA_PLACEHOLDER = "Scrivi qui la tua risposta in italiano…";

export const FREITEXT_ANSWER_EMPTY_MESSAGE = "Scrivi qualcosa prima di toccare Controlla.";

export const FREITEXT_ANSWER_UNCHANGED_TEMPLATE_MESSAGE =
  "Completa il testo prima di toccare Controlla.";

export const FREITEXT_ANSWER_TEMPLATE_STRUCTURE_MESSAGE =
  "Mantieni la struttura del testo e completa ogni campo.";

export function freitextAnswerTooShortMessage(minWords: number): string {
  return minWords === 1
    ? "Scrivi almeno una parola."
    : `Scrivi almeno ${minWords} parole.`;
}
