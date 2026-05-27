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
            if (!GameArtAssetKeys.TryNormalizeGameArtKey(portraitId, out var safeId))
                return null;
            return $"{GameArtAssetKeys.NpcPortraitKeyPrefix}{safeId}";
        }

        public static string ResolveNpcPortraitResourcesPath(string portraitId)
        {
            var key = NpcPortraitGameArtKey(portraitId);
            if (string.IsNullOrEmpty(key))
                return null;

            var path = GameArtAssetKeys.ToResourcesPath(key);
            return ResourceSpriteOrTextureExists(path) ? path : null;
        }

        public static string ResolvePlayerPortraitResourcesPath()
        {
            var path = GameArtAssetKeys.ToResourcesPath(GameArtAssetKeys.DefaultPlayerPortraitKey);
            return ResourceSpriteOrTextureExists(path) ? path : null;
        }

        private static bool ResourceSpriteOrTextureExists(string resourcePath)
        {
            if (string.IsNullOrWhiteSpace(resourcePath))
                return false;

            if (Resources.Load<Sprite>(resourcePath) != null)
                return true;

            return Resources.Load<Texture2D>(resourcePath) != null;
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
