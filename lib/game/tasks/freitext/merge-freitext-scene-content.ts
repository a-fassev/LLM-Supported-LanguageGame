/** Normalizes catalog `body` or task `bodyText` into the task-schema reference document shape. */
export function normalizeReferenceDocumentForTask(
  ref: unknown,
): Record<string, unknown> | null {
  if (!ref || typeof ref !== "object" || Array.isArray(ref)) return null;
  const record = ref as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const bodyText =
    (typeof record.bodyText === "string" ? record.bodyText.trim() : "") ||
    (typeof record.body === "string" ? record.body.trim() : "");
  if (!title || !bodyText) return null;
  const normalized: Record<string, unknown> = { title, bodyText };
  if (typeof record.documentId === "string" && record.documentId.trim()) {
    normalized.documentId = record.documentId.trim();
  }
  if (typeof record.buttonLabel === "string" && record.buttonLabel.trim()) {
    normalized.buttonLabel = record.buttonLabel.trim();
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
