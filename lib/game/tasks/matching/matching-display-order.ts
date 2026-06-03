import type { MatchingItemView } from "@/lib/game/tasks/matching/matching-types";

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

export function stableShuffleMatchingItems(items: MatchingItemView[], seed: string): MatchingItemView[] {
  if (items.length <= 1) return [...items];
  const copy = [...items];
  const random = seededRandom(hashSeed(seed));
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildMatchingDisplayOrder(
  content: { leftItems: MatchingItemView[]; rightItems: MatchingItemView[]; shuffleRightOrder: boolean },
  sceneId: string,
): { leftItems: MatchingItemView[]; rightItems: MatchingItemView[] } {
  const leftItems = [...content.leftItems];
  const rightItems = content.shuffleRightOrder
    ? stableShuffleMatchingItems(content.rightItems, `${sceneId}:right`)
    : [...content.rightItems];
  return { leftItems, rightItems };
}
