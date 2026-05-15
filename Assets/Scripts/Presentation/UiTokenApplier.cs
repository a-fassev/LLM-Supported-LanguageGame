using UnityEngine;
using UnityEngine.UI;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Lightweight static helpers that apply <see cref="UiDesignTokens"/> values to uGUI components,
    /// reducing boilerplate in runtime UI builders.
    /// </summary>
    public static class UiTokenApplier
    {
        private static Font _fallbackFont;

        /// <summary>Returns the Font from <paramref name="style"/>, or LegacyRuntime.ttf when the style font is null.</summary>
        public static Font ResolveFont(UiDesignTokens.TypographyStyle style)
        {
            if (style?.font != null)
                return style.font;
            if (_fallbackFont == null)
                _fallbackFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            return _fallbackFont;
        }

        /// <summary>Applies font, fontSize and color to a Text widget from a TypographyStyle + explicit color.</summary>
        public static void ApplyText(Text text, UiDesignTokens.TypographyStyle style, Color color)
        {
            if (text == null || style == null) return;
            text.font     = ResolveFont(style);
            text.fontSize = style.fontSize;
            text.color    = color;
        }

        /// <summary>Sets the targetGraphic Image color on a Button.</summary>
        public static void ApplyButtonColor(Button button, Color color)
        {
            if (button == null) return;
            if (button.targetGraphic is Image img)
                img.color = color;
        }

        /// <summary>Stretches a RectTransform to fill its parent (anchor 0,0 → 1,1, offsets zero).</summary>
        public static void StretchFull(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }
    }
}
