import type { ClozeTextClientContentParsed } from "@/lib/game/schemas/clozeTextContentSchema";

export type ClozeAnswersDraft = string[];

export type NormalizedClozeContent = ClozeTextClientContentParsed;

export const CLOZE_CONTENT_MISMATCH_MESSAGE =
  "Contenuto dell'attività non valido. Ricarica la pagina o riprova più tardi.";

export const CLOZE_INCOMPLETE_MESSAGE = "Completa tutte le lacune.";

export const CLOZE_DRAFT_LENGTH_MISMATCH_MESSAGE =
  "Le risposte non corrispondono al testo. Ricarica la pagina o riprova.";
