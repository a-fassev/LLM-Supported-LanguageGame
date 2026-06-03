type ClozeLineLike = {
  segments: { kind: string }[];
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
