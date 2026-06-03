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
