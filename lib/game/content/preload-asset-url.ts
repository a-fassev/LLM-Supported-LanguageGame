const MAX_CACHE_ENTRIES = 48;

const preloadCache = new Map<string, Promise<boolean>>();

function rememberPreload(url: string, promise: Promise<boolean>): Promise<boolean> {
  if (preloadCache.has(url)) {
    preloadCache.delete(url);
  }
  preloadCache.set(url, promise);
  while (preloadCache.size > MAX_CACHE_ENTRIES) {
    const oldest = preloadCache.keys().next().value;
    if (!oldest) break;
    preloadCache.delete(oldest);
  }
  return promise;
}

/**
 * Loads a content-asset URL into the browser image cache.
 * Resolves false on network/decode failure (caller keeps CSS fallback).
 */
export function preloadAssetUrl(url: string): Promise<boolean> {
  const cached = preloadCache.get(url);
  if (cached) {
    rememberPreload(url, cached);
    return cached;
  }

  const promise = new Promise<boolean>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

  return rememberPreload(url, promise);
}

/** Clears preload cache (tests only). */
export function clearAssetPreloadCache(): void {
  preloadCache.clear();
}
