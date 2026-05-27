using UnityEngine;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Resolves the equipped player cutscene portrait from GameArt (extend when Avatar Shop persists selection).
    /// </summary>
    internal static class CutscenePlayerPortraitProvider
    {
        public static Sprite GetCurrentPlayerPortraitSprite()
        {
            var path = GameArtResourceLoader.ResolvePlayerPortraitResourcesPath();
            return path != null ? GameArtResourceLoader.LoadSprite(path) : null;
        }

        /// <summary>Call when equipped avatar changes so the next cutscene beat reloads the portrait.</summary>
        public static void InvalidateEquippedPortraitCache()
        {
            var path = GameArtAssetKeys.ToResourcesPath(GameArtAssetKeys.DefaultPlayerPortraitKey);
            GameArtResourceLoader.Invalidate(path);
        }
    }
}
