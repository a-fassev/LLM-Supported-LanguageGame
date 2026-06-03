import { parseReferenceDocument } from "@/lib/game/schemas/referenceDocumentSchema";

/** Normalizes catalog `body` or task `bodyText` into a reference document record for tasks and play UI. */
export function normalizeReferenceDocumentForTask(
  ref: unknown,
): Record<string, unknown> | null {
  const parsed = parseReferenceDocument(ref);
  if (!parsed.ok) return null;

  const value = parsed.value;
  const bodyText =
    (typeof value.bodyText === "string" ? value.bodyText.trim() : "") ||
    (typeof value.body === "string" ? value.body.trim() : "");

  const normalized: Record<string, unknown> = { title: value.title };
  if (bodyText) {
    normalized.bodyText = bodyText;
  }
  if (typeof value.documentId === "string" && value.documentId.trim()) {
    normalized.documentId = value.documentId.trim();
  }
  if (typeof value.buttonLabel === "string" && value.buttonLabel.trim()) {
    normalized.buttonLabel = value.buttonLabel.trim();
  }
  if (value.figures?.length) {
    normalized.figures = value.figures;
  }
  if (value.sections?.length) {
    normalized.sections = value.sections;
  }
  return normalized;
}

function taskHasReferenceDocument(task: Record<string, unknown>): boolean {
  return normalizeReferenceDocumentForTask(task.referenceDocument) !== null;
}

/**
 * Merges scene shell fields into the payload shape expected by freetext parsers.
 * Shell `referenceDocument` is hoisted when the task payload has none (catalog uses `body`, task schema uses `bodyText`).
 */
export function mergeFreitextSceneContent(
  task: Record<string, unknown>,
  sceneInstruction?: string | null,
  shellReferenceDocument?: unknown,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...task };
  const instruction = sceneInstruction?.trim();
  if (instruction) {
    merged.instruction = instruction;
  }

  if (!taskHasReferenceDocument(merged)) {
    const shellRef = normalizeReferenceDocumentForTask(shellReferenceDocument);
    if (shellRef) {
      merged.referenceDocument = shellRef;
    }
  } else {
    const taskRef = normalizeReferenceDocumentForTask(merged.referenceDocument);
    if (taskRef) {
      merged.referenceDocument = taskRef;
    }
  }

  return merged;
}
