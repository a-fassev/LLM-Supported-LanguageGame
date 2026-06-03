export type MultipleChoiceAttemptPayload = {
  taskType: "MultipleChoice";
  multipleChoice: {
    selections: string[][];
  };
};

export function buildMcAttempt(selections: string[][]): MultipleChoiceAttemptPayload {
  return {
    taskType: "MultipleChoice",
    multipleChoice: {
      selections: selections.map((row) => [...row]),
    },
  };
}
