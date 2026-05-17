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

            foreach (var path in new[] { "LegacyRuntime.ttf", "Arial.ttf" })
            {
                _fallbackFont = TryGetBuiltinFont(path);
                if (_fallbackFont != null)
                    return _fallbackFont;
            }

            _fallbackFont = Font.CreateDynamicFontFromOSFont(
                new[] { "Arial", "Helvetica", "Liberation Sans", "DejaVu Sans", "Noto Sans" }, 16);

            if (_fallbackFont == null)
            {
                var arial = Resources.GetBuiltinResource<Font>("Arial.ttf");
                if (arial != null)
                    _fallbackFont = arial;
            }

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

        /// <summary>
        /// Standard uGUI ColorTint transition: sets base <see cref="Image.color"/> to white so <see cref="Button.colors"/> drive the tint.
        /// </summary>
        public static void PrepareButtonGraphicForColorTint(Button button)
        {
            if (button == null || button.targetGraphic is not Image img) return;
            img.color = Color.white;
        }

        /// <summary>Applies <see cref="UiDesignTokens.InteractionTokens"/> to a <see cref="Button"/> color block.</summary>
        public static void ApplyButtonInteractionColors(Button button, UiDesignTokens.InteractionTokens interaction)
        {
            if (button == null || interaction == null) return;
            var colors = button.colors;
            colors.normalColor = interaction.buttonNormal;
            colors.highlightedColor = interaction.buttonHighlighted;
            colors.pressedColor = interaction.buttonPressed;
            colors.disabledColor = interaction.buttonDisabled;
            colors.colorMultiplier = 1f;
            colors.fadeDuration = 0.1f;
            button.colors = colors;
        }

        /// <summary>Muted / secondary actions — uses <see cref="PaletteTokens.primaryMuted"/> with a simple highlight/press ramp.</summary>
        public static void ApplySecondaryButtonColors(Button button, UiDesignTokens.PaletteTokens palette)
        {
            if (button == null || palette == null) return;
            var colors = button.colors;
            colors.normalColor = palette.primaryMuted;
            colors.highlightedColor = Color.Lerp(palette.primaryMuted, Color.white, 0.12f);
            colors.pressedColor = Color.Lerp(palette.primaryMuted, Color.black, 0.18f);
            colors.selectedColor = colors.highlightedColor;
            colors.disabledColor = new Color(0.55f, 0.55f, 0.55f, 0.5f);
            colors.colorMultiplier = 1f;
            colors.fadeDuration = 0.1f;
            button.colors = colors;
        }

        /// <summary>Nearest parent <see cref="Image"/> tint, or <paramref name="fallback"/> for light quest panels without an image parent.</summary>
        public static Color GetPanelBackgroundNear(RectTransform from, Color fallback)
        {
            if (from == null)
                return fallback;
            var image = from.GetComponentInParent<Image>();
            return image != null ? image.color : fallback;
        }

        /// <summary>Ensures readable body text on bright task panels vs dark menus using palette <c>textPrimary</c>.</summary>
        public static Color ResolveReadableOnBackground(Color foregroundCandidate, Color background)
        {
            if (HasSufficientContrast(foregroundCandidate, background))
                return foregroundCandidate;
            return IsLightBackground(background) ? new Color(0.1f, 0.12f, 0.18f, 1f) : Color.white;
        }

        /// <summary>Input field fill: uses token tint when it contrasts; otherwise a safe translucent fill on <paramref name="panelBackground"/>.</summary>
        public static Color ResolveInputFieldBackgroundOnPanel(Color tokenInputBackground, Color panelBackground)
        {
            if (HasSufficientContrast(tokenInputBackground, panelBackground))
                return tokenInputBackground;
            return IsLightBackground(panelBackground)
                ? new Color(0f, 0f, 0f, 0.12f)
                : new Color(1f, 1f, 1f, 0.14f);
        }

        private static bool HasSufficientContrast(Color foreground, Color background)
        {
            return ContrastRatio(foreground, background) >= 3f;
        }

        private static bool IsLightBackground(Color c) => RelativeLuminance(c) >= 0.6f;

        private static float ContrastRatio(Color a, Color b)
        {
            var la = RelativeLuminance(a);
            var lb = RelativeLuminance(b);
            var lighter = Mathf.Max(la, lb);
            var darker = Mathf.Min(la, lb);
            return (lighter + 0.05f) / (darker + 0.05f);
        }

        private static float RelativeLuminance(Color c)
        {
            var r = SrgbToLinear(c.r);
            var g = SrgbToLinear(c.g);
            var b = SrgbToLinear(c.b);
            return 0.2126f * r + 0.7152f * g + 0.0722f * b;
        }

        private static float SrgbToLinear(float channel)
        {
            return channel <= 0.04045f
                ? channel / 12.92f
                : Mathf.Pow((channel + 0.055f) / 1.055f, 2.4f);
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
