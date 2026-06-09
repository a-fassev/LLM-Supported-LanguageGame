export class AllGeminiApiKeysRateLimitedError extends Error {
  constructor() {
    super("All Gemini API keys are rate limited");
    this.name = "AllGeminiApiKeysRateLimitedError";
  }
}

export type GeminiApiKeySelection = {
  index: number;
  apiKey: string;
};

export type GeminiApiKeyPool = {
  acquireKey: () => GeminiApiKeySelection;
  markRateLimited: (index: number, cooldownMs?: number) => void;
};

const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 60_000;

export function createGeminiApiKeyPool(
  keys: readonly string[],
  defaultCooldownMs = DEFAULT_RATE_LIMIT_COOLDOWN_MS,
): GeminiApiKeyPool {
  if (keys.length === 0) {
    throw new Error("Gemini API key pool requires at least one key");
  }

  let roundRobinCursor = 0;
  const cooldownUntil = keys.map(() => 0);

  function acquireKey(): GeminiApiKeySelection {
    const now = Date.now();
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const index = (roundRobinCursor + attempt) % keys.length;
      if (cooldownUntil[index]! <= now) {
        roundRobinCursor = (index + 1) % keys.length;
        return { index, apiKey: keys[index]! };
      }
    }
    throw new AllGeminiApiKeysRateLimitedError();
  }

  function markRateLimited(index: number, cooldownMs = defaultCooldownMs): void {
    if (index < 0 || index >= keys.length) return;
    cooldownUntil[index] = Date.now() + Math.max(0, cooldownMs);
  }

  return { acquireKey, markRateLimited };
}
