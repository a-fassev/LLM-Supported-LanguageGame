export type DragDropItemView = {
  id: string;
  label: string;
};

export type DragDropTargetView = {
  id: string;
  title?: string;
  matchMode: "one" | "all";
};

export type NormalizedDragDropContent = {
  prompt?: string;
  subtitle?: string;
  items: DragDropItemView[];
  targets: DragDropTargetView[];
  sourceLabel: string;
  targetLabel: string;
  shuffleItemOrder: boolean;
  requireBankEmpty: boolean;
};

/** targetId -> placed item ids */
export type DragDropAssignmentsDraft = Record<string, string[]>;

export type DragDropAssignmentsUpdater =
  | DragDropAssignmentsDraft
  | ((prev: DragDropAssignmentsDraft) => DragDropAssignmentsDraft);

export const DRAG_DROP_DRAG_HINT =
  "Tocca una carta e trascinala nella zona della categoria corretta. Puoi spostarle di nuovo se sbagli.";
export const DRAG_DROP_ZONE_HINT = "Trascina qui";
export const DRAG_DROP_INCOMPLETE_ZONES_MESSAGE = "Completa tutte le zone di rilascio.";
export const DRAG_DROP_BANK_NOT_EMPTY_MESSAGE = "Posiziona tutte le carte.";
export const DRAG_DROP_CONTENT_MISMATCH_MESSAGE =
  "Contenuto drag-and-drop non valido. Ricarica la pagina o riprova più tardi.";

export const DEFAULT_DRAG_DROP_SOURCE_LABEL = "Parole da spostare";
export const DEFAULT_DRAG_DROP_TARGET_LABEL = "Trascina qui sotto nella categoria giusta";

export const DRAG_DROP_DRAG_THRESHOLD_PX = 10;

/** Matches DragDropTile min height; drop zones keep at least this slot when empty. */
export const DRAG_DROP_SLOT_MIN_HEIGHT_CLASS = "min-h-11";
