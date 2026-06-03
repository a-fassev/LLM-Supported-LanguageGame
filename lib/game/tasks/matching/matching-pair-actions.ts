import type { MatchingPairsDraft } from "@/lib/game/tasks/matching/matching-types";

/** Unity TryPair parity: steal right, toggle off same pair. */
export function applyMatchingPair(
  pairs: MatchingPairsDraft,
  leftId: string,
  rightId: string,
  leftIds: readonly string[],
): MatchingPairsDraft {
  const next: MatchingPairsDraft = { ...pairs };

  if (next[leftId] === rightId) {
    next[leftId] = null;
    return next;
  }

  for (const otherLeftId of leftIds) {
    if (otherLeftId !== leftId && next[otherLeftId] === rightId) {
      next[otherLeftId] = null;
    }
  }

  next[leftId] = rightId;
  return next;
}

export function clearMatchingPair(pairs: MatchingPairsDraft, leftId: string): MatchingPairsDraft {
  if (pairs[leftId] == null) return pairs;
  return { ...pairs, [leftId]: null };
}
