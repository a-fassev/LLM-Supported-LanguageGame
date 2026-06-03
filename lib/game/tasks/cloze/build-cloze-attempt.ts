export type ClozeAttemptPayload = {
  taskType: "ClozeText";
  clozeText: {
    answers: string[];
  };
};

export function buildClozeAttempt(answers: readonly string[]): ClozeAttemptPayload {
  return {
    taskType: "ClozeText",
    clozeText: {
      answers: answers.map((value) => (typeof value === "string" ? value : "").trim()),
    },
  };
}
