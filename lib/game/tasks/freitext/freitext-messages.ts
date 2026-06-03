/** Learner-facing Italian copy for freitext tasks. */

export const FREITEXT_CONTENT_MISMATCH_MESSAGE =
  "Contenuto attività non valido. Ricarica la pagina o contatta il docente.";

export const FREITEXT_EVALUATING_MESSAGE = "Sto leggendo il tuo testo…";

export const FREITEXT_TEXTAREA_PLACEHOLDER = "Scrivi qui la tua risposta in italiano…";

export const FREITEXT_ANSWER_EMPTY_MESSAGE = "Scrivi qualcosa prima di toccare Controlla.";

export function freitextAnswerTooShortMessage(minWords: number): string {
  return minWords === 1
    ? "Scrivi almeno una parola."
    : `Scrivi almeno ${minWords} parole.`;
}

export function freitextAnswerTooLongMessage(maxWords: number): string {
  return maxWords === 1 ? "Resta entro una parola." : `Resta entro ${maxWords} parole.`;
}

export const FREITEXT_ABSOLUTE_MAX_CHARACTERS = 8000;

export function freitextAnswerTooManyCharactersMessage(): string {
  return `La risposta può avere al massimo ${FREITEXT_ABSOLUTE_MAX_CHARACTERS} caratteri.`;
}
