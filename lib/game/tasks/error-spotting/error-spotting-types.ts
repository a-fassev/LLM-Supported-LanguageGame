export const ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE = "Contenuto dell'esercizio non valido.";

export const ERROR_SPOTTING_EMPTY_CORRECTION_MESSAGE =
  "Scrivi la correzione per ogni errore selezionato.";

export const ERROR_SPOTTING_CORRECTION_MAX_LENGTH = 128;

export type ErrorSpottingSegmentView = {
  id: string;
  text: string;
  hint?: string;
};

export type NormalizedErrorSpottingContent = {
  prompt?: string;
  counterCaption?: string;
  errorCount: number;
  expectedErrorRange: { min: number; max: number };
  segments: ErrorSpottingSegmentView[];
};

export type ErrorSpottingDraft = {
  selectedSegmentIds: string[];
  corrections: Record<string, string>;
};
