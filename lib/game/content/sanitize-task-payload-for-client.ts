/** Strip server-only answer keys before task payloads reach the browser. */

function stripMcAnswers(task: Record<string, unknown>): Record<string, unknown> {
  const next = { ...task };
  delete next.correctOptionIds;

  if (Array.isArray(next.questions)) {
    next.questions = next.questions.map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
      const question = { ...(entry as Record<string, unknown>) };
      delete question.correctOptionIds;
      return question;
    });
  }

  return next;
}

function stripMatchingAnswers(task: Record<string, unknown>): Record<string, unknown> {
  const next = { ...task };
  delete next.correctPairs;
  delete next.poolPairs;
  delete next.sampleSize;
  return next;
}

function stripClozeAnswers(task: Record<string, unknown>): Record<string, unknown> {
  const next = { ...task };
  if (!Array.isArray(next.lines)) return next;

  next.lines = next.lines.map((lineEntry) => {
    if (!lineEntry || typeof lineEntry !== "object" || Array.isArray(lineEntry)) return lineEntry;
    const line = lineEntry as Record<string, unknown>;
    if (!Array.isArray(line.segments)) return lineEntry;

    return {
      ...line,
      segments: line.segments.map((segmentEntry) => {
        if (!segmentEntry || typeof segmentEntry !== "object" || Array.isArray(segmentEntry)) {
          return segmentEntry;
        }
        const segment = { ...(segmentEntry as Record<string, unknown>) };
        delete segment.correctAnswers;
        return segment;
      }),
    };
  });

  return next;
}

function stripFreitextRubric(task: Record<string, unknown>): Record<string, unknown> {
  const next = { ...task };
  delete next.evaluation;
  return next;
}

function stripDragDropAnswers(task: Record<string, unknown>): Record<string, unknown> {
  const next = { ...task };
  if (Array.isArray(next.targets)) {
    next.targets = next.targets.map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
      const target = { ...(entry as Record<string, unknown>) };
      delete target.correctItemIds;
      return target;
    });
  }
  delete next.lines;
  return next;
}

function stripErrorSpottingAnswers(task: Record<string, unknown>): Record<string, unknown> {
  const next = { ...task };
  let errorCount = 0;

  if (Array.isArray(next.segments)) {
    next.segments = next.segments.map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
      const segment = { ...(entry as Record<string, unknown>) };
      if (segment.isError === true) {
        errorCount++;
      }
      delete segment.isError;
      delete segment.acceptedCorrections;
      return segment;
    });
  }

  const range = next.expectedErrorRange;
  const hasRange =
    range && typeof range === "object" && !Array.isArray(range) && "min" in range && "max" in range;

  if (errorCount > 0 && !hasRange) {
    next.expectedErrorRange = { min: errorCount, max: errorCount };
  }

  return next;
}

export function sanitizeTaskPayloadForClient(
  screenType: string,
  taskPayload: Record<string, unknown>,
): Record<string, unknown> {
  switch (screenType) {
    case "multiple_choice":
      return stripMcAnswers(taskPayload);
    case "matching":
      return stripMatchingAnswers(taskPayload);
    case "drag_drop":
      return stripDragDropAnswers(taskPayload);
    case "free_text":
      return stripFreitextRubric(taskPayload);
    case "error_spotting":
      return stripErrorSpottingAnswers(taskPayload);
    case "cloze":
      return stripClozeAnswers(taskPayload);
    default:
      return { ...taskPayload };
  }
}

export function sanitizeSceneContentForClient(
  sceneType: string,
  screenType: string,
  content: Record<string, unknown>,
): Record<string, unknown> {
  if (sceneType !== "task") {
    return { ...content };
  }

  const next = { ...content };
  const nestedTask = content.task;
  if (nestedTask && typeof nestedTask === "object" && !Array.isArray(nestedTask)) {
    next.task = sanitizeTaskPayloadForClient(screenType, nestedTask as Record<string, unknown>);
    return next;
  }

  return sanitizeTaskPayloadForClient(screenType, next);
}
