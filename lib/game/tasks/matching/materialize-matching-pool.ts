export type MatchingPoolPair = {
  id: string;
  leftLabel: string;
  rightLabel: string;
};

export type MatchingPresentation = {
  leftLabel?: string;
  rightLabel?: string;
  shuffleRightOrder?: boolean;
};

export type MaterializeMatchingPoolInput = {
  poolPairs: MatchingPoolPair[];
  sampleSize: number;
  prompt?: string;
  subtitle?: string;
  presentation?: MatchingPresentation;
};

export type MaterializedMatchingItem = {
  id: string;
  label: string;
};

export type MaterializedMatchingPair = {
  leftItemId: string;
  rightItemId: string;
};

export type MaterializedMatchingTask = {
  prompt?: string;
  subtitle?: string;
  leftItems: MaterializedMatchingItem[];
  rightItems: MaterializedMatchingItem[];
  correctPairs: MaterializedMatchingPair[];
  presentation?: MatchingPresentation;
};

export type MaterializeMatchingPoolOptions = {
  /** Test-only: fixed indices into poolPairs (length must equal sampleSize). */
  pickIndices?: number[];
};

function shuffleInPlace<T>(arr: T[], random: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

function defaultRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! / 0xffffffff;
}

export function materializeMatchingPool(
  input: MaterializeMatchingPoolInput,
  options?: MaterializeMatchingPoolOptions,
): MaterializedMatchingTask {
  const { poolPairs, sampleSize } = input;
  if (poolPairs.length === 0) {
    throw new Error("poolPairs must not be empty");
  }
  const size = Math.max(1, Math.min(Math.trunc(sampleSize), poolPairs.length));

  let picked: MatchingPoolPair[];
  if (options?.pickIndices) {
    if (options.pickIndices.length !== size) {
      throw new Error("pickIndices length must match sampleSize");
    }
    picked = options.pickIndices.map((index) => {
      const pair = poolPairs[index];
      if (!pair) throw new Error(`invalid pick index: ${index}`);
      return pair;
    });
  } else {
    const shuffled = [...poolPairs];
    shuffleInPlace(shuffled, defaultRandom);
    picked = shuffled.slice(0, size);
  }

  const leftItems: MaterializedMatchingItem[] = picked.map((pair) => ({
    id: `left_${pair.id}`,
    label: pair.leftLabel,
  }));
  const rightItems: MaterializedMatchingItem[] = picked.map((pair) => ({
    id: `right_${pair.id}`,
    label: pair.rightLabel,
  }));
  const correctPairs: MaterializedMatchingPair[] = picked.map((pair) => ({
    leftItemId: `left_${pair.id}`,
    rightItemId: `right_${pair.id}`,
  }));

  return {
    ...(input.prompt !== undefined ? { prompt: input.prompt } : {}),
    ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
    leftItems,
    rightItems,
    correctPairs,
    ...(input.presentation !== undefined ? { presentation: input.presentation } : {}),
  };
}

export function matchingTaskHasPoolAuthoring(task: Record<string, unknown>): boolean {
  return (
    Array.isArray(task.poolPairs) &&
    task.poolPairs.length > 0 &&
    typeof task.sampleSize === "number"
  );
}

export function matchingTaskHasConcreteItems(task: Record<string, unknown>): boolean {
  return (
    Array.isArray(task.leftItems) &&
    task.leftItems.length > 0 &&
    Array.isArray(task.rightItems) &&
    task.rightItems.length > 0 &&
    Array.isArray(task.correctPairs) &&
    task.correctPairs.length > 0
  );
}
