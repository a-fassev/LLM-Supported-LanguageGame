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

        /// <summary>
        /// Returns the Font from <paramref name="style"/>, or a resilient runtime fallback font when the style font is null.
        /// </summary>
        public static Font ResolveFont(UiDesignTokens.TypographyStyle style)
        {
            if (style?.font != null)
                return style.font;
            return ResolveFallbackFont();
        }

        /// <summary>
        /// Resolves a runtime-safe fallback font across Unity versions.
        /// </summary>
        public static Font ResolveFallbackFont()
        {
            if (_fallbackFont != null)
                return _fallbackFont;

            _fallbackFont = TryGetBuiltinFont("LegacyRuntime.ttf");
            if (_fallbackFont == null)
                _fallbackFont = TryGetBuiltinFont("Arial.ttf");

            if (_fallbackFont == null)
                _fallbackFont = Font.CreateDynamicFontFromOSFont(
                    new[] { "Arial", "Helvetica", "Liberation Sans", "DejaVu Sans", "Noto Sans" }, 16);

            if (_fallbackFont == null)
                Debug.LogError("[UiTokenApplier] No fallback font available.");

            return _fallbackFont;
        }

        private static Font TryGetBuiltinFont(string path)
        {
            try
            {
                return Resources.GetBuiltinResource<Font>(path);
            }
            catch (System.ArgumentException)
            {
                return null;
            }
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
