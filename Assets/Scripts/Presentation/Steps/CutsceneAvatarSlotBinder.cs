using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Binds cutscene avatar slots from Resources portraits with USS placeholder fallback.</summary>
    internal static class CutsceneAvatarSlotBinder
    {
        private const string PlaceholderClass = "lg-cutscene-avatar-slot--placeholder";

        public static void BindPlayerSlot(VisualElement slot)
        {
            if (slot == null)
                return;

            ToolkitStepUx.ClearHost(slot);
            ApplyPortrait(slot, CutscenePlayerPortraitProvider.GetCurrentPlayerPortraitSprite());
        }

        public static void BindNpcSlot(VisualElement slot, string portraitId)
        {
            if (slot == null)
                return;

            ToolkitStepUx.ClearHost(slot);
            var path = CutscenePortraitResourceLoader.NpcPortraitPath(portraitId);
            var sprite = path != null ? CutscenePortraitResourceLoader.LoadSprite(path) : null;
            ApplyPortrait(slot, sprite);
        }

        private static void ApplyPortrait(VisualElement slot, Sprite sprite)
        {
            slot.RemoveFromClassList(PlaceholderClass);
            if (sprite != null)
            {
                slot.style.backgroundImage = new StyleBackground(sprite);
                return;
            }

            slot.style.backgroundImage = StyleKeyword.Null;
            slot.AddToClassList(PlaceholderClass);
        }
    }
}
