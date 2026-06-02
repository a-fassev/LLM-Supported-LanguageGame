const ROOT = "/content-assets";

/**
 * Converts a content background key into a public URL.
 * Returns null when no key is available so callers can use CSS fallbacks.
 */
export function resolveAssetUrl(assetKey: string | null | undefined): string | null {
  const key = assetKey?.trim();
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;

  const normalized = key.replace(/^\/+/, "").replace(/\.(png|jpg|jpeg|webp|avif)$/i, "");
  return `${ROOT}/${normalized}.png`;
}
