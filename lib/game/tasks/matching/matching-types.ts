export type MatchingItemView = {
  id: string;
  label: string;
};

export type NormalizedMatchingContent = {
  prompt?: string;
  leftItems: MatchingItemView[];
  rightItems: MatchingItemView[];
  leftLabel: string;
  rightLabel: string;
  shuffleRightOrder: boolean;
};

export type MatchingPairsDraft = Record<string, string | null>;

export type MatchingPairsUpdater =
  | MatchingPairsDraft
  | ((prev: MatchingPairsDraft) => MatchingPairsDraft);

export type MatchingLineSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type MatchingPoint = {
  x: number;
  y: number;
};

export const MATCHING_DRAG_THRESHOLD_PX = 10;
export const MATCHING_DRAG_HINT = "Trascina una linea o tocca due carte.";
export const MATCHING_INCOMPLETE_MESSAGE = "Completa ogni abbinamento.";
export const MATCHING_CONTENT_MISMATCH_MESSAGE =
  "Contenuto abbinamento non valido. Ricarica la pagina o riprova più tardi.";

export const DEFAULT_MATCHING_LEFT_LABEL = "Italiano";
export const DEFAULT_MATCHING_RIGHT_LABEL = "Traduzione";
