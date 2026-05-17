using UnityEngine;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Typography and contrast helpers aligned with <see cref="UiDesignTokens"/> — stack-agnostic (no uGUI types).
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

        /// <summary>Ensures readable body text on bright panels vs dark menus using palette candidates.</summary>
        public static Color ResolveReadableOnBackground(Color foregroundCandidate, Color background)
        {
            if (HasSufficientContrast(foregroundCandidate, background))
                return foregroundCandidate;
            return IsLightBackground(background) ? new Color(0.1f, 0.12f, 0.18f, 1f) : Color.white;
        }

        /// <summary>Input field fill tuned against a panel background when token tint lacks contrast.</summary>
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
    }
}
