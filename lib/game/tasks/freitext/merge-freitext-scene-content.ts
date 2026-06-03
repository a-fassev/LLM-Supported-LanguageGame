/** Merges scene shell instruction into the payload shape expected by `parseFreitextLlmStepContent`. */
export function mergeFreitextSceneContent(
  task: Record<string, unknown>,
  sceneInstruction?: string | null,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...task };
  const instruction = sceneInstruction?.trim();
  if (instruction) {
    merged.instruction = instruction;
  }
  return merged;
}
