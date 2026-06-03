export type MatchingAttemptPayload = {
  taskType: "Matching";
  matching: {
    pairs: Record<string, string>;
  };
};

export function buildMatchingAttempt(
  leftIds: readonly string[],
  pairs: Record<string, string | null>,
): MatchingAttemptPayload {
  const payload: Record<string, string> = {};
  for (const leftId of leftIds) {
    payload[leftId] = pairs[leftId]?.trim() ?? "";
  }
  return {
    taskType: "Matching",
    matching: { pairs: payload },
  };
}
