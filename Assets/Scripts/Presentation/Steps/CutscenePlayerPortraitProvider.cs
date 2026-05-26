using System.Collections.Generic;
using UnityEngine;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Resolves the equipped player cutscene portrait. V1: static Resources sprite at
    /// <see cref="DefaultPlayerPortraitPath"/>; extend when Avatar Shop persists selection on the client.
    /// </summary>
    internal static class CutscenePlayerPortraitProvider
    {
        public const string DefaultPlayerPortraitPath = "UI/CutscenePortraits/Player/current";

        public static Sprite GetCurrentPlayerPortraitSprite() =>
            CutscenePortraitResourceLoader.LoadSprite(DefaultPlayerPortraitPath);

        /// <summary>Call when equipped avatar changes so the next cutscene beat reloads the portrait.</summary>
        public static void InvalidateEquippedPortraitCache() =>
            CutscenePortraitResourceLoader.Invalidate(DefaultPlayerPortraitPath);
    }

    internal static class CutscenePortraitResourceLoader
    {
        private static readonly Dictionary<string, Sprite> SpriteCache = new();
        private static readonly HashSet<string> RuntimeCreatedPaths = new();

        public static string NpcPortraitPath(string portraitId)
        {
            if (!TrySanitizePortraitId(portraitId, out var safeId))
                return null;
            return $"UI/CutscenePortraits/Npc/{safeId}";
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
                new Vector2(0.5f, 1f),
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

        /// <summary>Rejects path-like or odd characters in authored portrait ids.</summary>
        internal static bool TrySanitizePortraitId(string portraitId, out string safeId)
        {
            safeId = null;
            if (string.IsNullOrWhiteSpace(portraitId))
                return false;

            var trimmed = portraitId.Trim();
            if (trimmed.Length == 0)
                return false;

            foreach (var c in trimmed)
            {
                if (!char.IsLetterOrDigit(c) && c != '_' && c != '-')
                    return false;
            }

            safeId = trimmed;
            return true;
        }
    }
}
