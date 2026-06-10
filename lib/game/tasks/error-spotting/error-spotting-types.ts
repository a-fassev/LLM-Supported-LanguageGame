export const ERROR_SPOTTING_CONTENT_MISMATCH_MESSAGE = "Contenuto dell'esercizio non valido.";

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
};
