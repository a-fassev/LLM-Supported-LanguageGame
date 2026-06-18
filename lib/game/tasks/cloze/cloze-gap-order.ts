type ClozeLineLike = {
  segments: { kind: string; optional?: boolean }[];
};

export function countClozeGaps(lines: readonly ClozeLineLike[]): number {
  let count = 0;
  for (const line of lines) {
    for (const segment of line.segments) {
      if (segment.kind === "gap") count += 1;
    }
  }
  return count;
}

export function createEmptyClozeAnswers(gapCount: number): string[] {
  return Array.from({ length: gapCount }, () => "");
}

export function collectOptionalClozeGapIndexes(lines: readonly ClozeLineLike[]): Set<number> {
  const optionalIndexes = new Set<number>();
  let gapIndex = 0;
  for (const line of lines) {
    for (const segment of line.segments) {
      if (segment.kind !== "gap") continue;
      if (segment.optional === true) optionalIndexes.add(gapIndex);
      gapIndex += 1;
    }
  }
  return optionalIndexes;
}
