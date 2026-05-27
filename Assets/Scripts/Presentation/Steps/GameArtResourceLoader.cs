using System.Collections.Generic;
using UnityEngine;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Loads sprites/textures from <see cref="GameArtAssetKeys.ResourcesRoot"/> with caching and legacy portrait fallback.</summary>
    internal static class GameArtResourceLoader
    {
        private static readonly Dictionary<string, Sprite> SpriteCache = new();
        private static readonly HashSet<string> RuntimeCreatedPaths = new();

        public static Sprite LoadSpriteByGameArtKey(string gameArtKey)
        {
            var path = GameArtAssetKeys.ToResourcesPath(gameArtKey);
            return LoadSprite(path);
        }

        public static Sprite LoadSprite(string resourcePath)
        {
            if (string.IsNullOrWhiteSpace(resourcePath))
                return null;

            if (SpriteCache.TryGetValue(resourcePath, out var cached))
                return cached;

            var sprite = Resources.Load<Sprite>(resourcePath);
            if (sprite != null)
            {
                SpriteCache[resourcePath] = sprite;
                return sprite;
            }

            var texture = Resources.Load<Texture2D>(resourcePath);
            if (texture == null)
                return null;

            sprite = Sprite.Create(
                texture,
                new Rect(0, 0, texture.width, texture.height),
                new Vector2(0.5f, 0.5f),
                100f);
            SpriteCache[resourcePath] = sprite;
            RuntimeCreatedPaths.Add(resourcePath);
            return sprite;
        }

        public static void Invalidate(string resourcePath)
        {
            if (string.IsNullOrWhiteSpace(resourcePath))
                return;

            if (!SpriteCache.TryGetValue(resourcePath, out var sprite))
                return;

            SpriteCache.Remove(resourcePath);
            if (!RuntimeCreatedPaths.Remove(resourcePath) || sprite == null)
                return;

            Object.Destroy(sprite);
        }

        public static string NpcPortraitGameArtKey(string portraitId)
        {
            if (!TrySanitizeAssetKeySegment(portraitId, out var safeId))
                return null;
            return $"{GameArtAssetKeys.NpcPortraitKeyPrefix}{safeId}";
        }

        public static string ResolveNpcPortraitResourcesPath(string portraitId)
        {
            var key = NpcPortraitGameArtKey(portraitId);
            if (!string.IsNullOrEmpty(key))
            {
                var primary = GameArtAssetKeys.ToResourcesPath(key);
                if (LoadSprite(primary) != null)
                    return primary;
            }

            return CutscenePortraitResourceLoader.NpcPortraitPath(portraitId);
        }

        public static string ResolvePlayerPortraitResourcesPath()
        {
            var primary = GameArtAssetKeys.ToResourcesPath(GameArtAssetKeys.DefaultPlayerPortraitKey);
            if (LoadSprite(primary) != null)
                return primary;

            return CutscenePlayerPortraitProvider.LegacyDefaultPlayerPortraitPath;
        }

        internal static bool TrySanitizeAssetKeySegment(string raw, out string safe)
        {
            safe = null;
            if (string.IsNullOrWhiteSpace(raw))
                return false;

            var trimmed = raw.Trim();
            if (trimmed.Length == 0)
                return false;

            foreach (var c in trimmed)
            {
                if (!char.IsLetterOrDigit(c) && c != '_' && c != '-' && c != '/')
                    return false;
            }

            safe = trimmed;
            return true;
        }

        /// <summary>Prefer <paramref name="assetId"/>; optional legacy HTTP URL handled by caller.</summary>
        public static string ResolveMediaGameArtKey(string assetId, string legacyImageUrl)
        {
            if (!string.IsNullOrWhiteSpace(assetId))
                return assetId.Trim();
            return null;
        }
    }
}
