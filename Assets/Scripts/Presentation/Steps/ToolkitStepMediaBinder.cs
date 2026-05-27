using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    internal static class ToolkitStepMediaBinder
    {
        public static bool TryApplyImageFromAssetId(VisualElement target, string assetId)
        {
            if (target == null)
                return false;

            var key = GameArtResourceLoader.ResolveMediaGameArtKey(assetId, null);
            if (string.IsNullOrEmpty(key))
                return false;

            var sprite = GameArtResourceLoader.LoadSpriteByGameArtKey(key);
            if (sprite == null)
                return false;

            target.style.display = DisplayStyle.Flex;
            target.style.backgroundImage = new StyleBackground(sprite);
            target.style.backgroundSize = new BackgroundSize(BackgroundSizeType.Cover);
            return true;
        }
    }
}
