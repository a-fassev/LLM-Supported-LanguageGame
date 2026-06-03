export type McOptionView = {
  id: string;
  label: string;
};

export type NormalizedMcQuestion = {
  id?: string;
  selectionMode: string;
  preserveOptionOrder: boolean;
  prompt?: string;
  options: McOptionView[];
};

export type NormalizedMcContent = {
  questions: NormalizedMcQuestion[];
};

export type McSelectionsDraft = string[][];
