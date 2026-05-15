using System;
using UnityEngine;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Single source of truth for all uGUI visual design tokens: spacing, typography, palette, interaction colors,
    /// and standard layout dimensions. Create one asset per visual variant via the Create menu and assign it to
    /// <see cref="UiThemeProvider"/> on the persistent GameFlow object.
    /// </summary>
    [CreateAssetMenu(fileName = "UiDesignTokens", menuName = "LanguageGame/UI Design Tokens", order = 10)]
    public class UiDesignTokens : ScriptableObject
    {
        [SerializeField] public SpacingTokens spacing = new SpacingTokens();
        [SerializeField] public TypographyTokens typography = new TypographyTokens();
        [SerializeField] public PaletteTokens palette = new PaletteTokens();
        [SerializeField] public InteractionTokens interaction = new InteractionTokens();
        [SerializeField] public LayoutTokens layout = new LayoutTokens();

        /// <summary>Called by Unity when the asset is first created via the Create menu — sets design defaults.</summary>
        private void Reset()
        {
            spacing = new SpacingTokens();
            typography = new TypographyTokens();
            palette = new PaletteTokens();
            interaction = new InteractionTokens();
            layout = new LayoutTokens();
        }

        // ── Spacing ─────────────────────────────────────────────────────────────────
        [Serializable]
        public class SpacingTokens
        {
            [Tooltip("4 px")] public float xs = 4f;
            [Tooltip("8 px")] public float s  = 8f;
            [Tooltip("16 px")] public float m = 16f;
            [Tooltip("24 px")] public float l = 24f;
            [Tooltip("48 px")] public float xl = 48f;
        }

        // ── Typography ───────────────────────────────────────────────────────────────
        [Serializable]
        public class TypographyStyle
        {
            [Tooltip("Leave null to fall back to LegacyRuntime.ttf at runtime.")]
            public Font font;
            public int fontSize = 26;
        }

        [Serializable]
        public class TypographyTokens
        {
            [Tooltip("Screen title / hero heading")] public TypographyStyle display = new TypographyStyle { fontSize = 48 };
            [Tooltip("Section heading / username")]   public TypographyStyle title   = new TypographyStyle { fontSize = 28 };
            [Tooltip("Primary body and button labels")] public TypographyStyle body  = new TypographyStyle { fontSize = 26 };
            [Tooltip("Status text, secondary labels, banner text")] public TypographyStyle caption = new TypographyStyle { fontSize = 22 };
            [Tooltip("Dialog button labels, small helpers")] public TypographyStyle small = new TypographyStyle { fontSize = 18 };
        }

        // ── Palette ──────────────────────────────────────────────────────────────────
        [Serializable]
        public class PaletteTokens
        {
            [Header("Backgrounds")]
            public Color background     = new Color(0.13f, 0.13f, 0.20f, 1.00f);
            public Color surface        = new Color(0.12f, 0.12f, 0.14f, 1.00f);

            [Header("Brand")]
            public Color primary        = new Color(0.20f, 0.55f, 0.85f, 1.00f);
            public Color primaryMuted   = new Color(0.25f, 0.35f, 0.50f, 0.90f);
            public Color onPrimary      = Color.white;

            [Header("Text")]
            public Color textPrimary    = Color.white;
            public Color textSecondary  = new Color(1.00f, 0.85f, 0.30f, 1.00f);

            [Header("Feedback")]
            public Color errorBackground = new Color(0.12f, 0.02f, 0.02f, 0.94f);
            public Color errorText       = new Color(1.00f, 0.85f, 0.85f, 1.00f);
            public Color success         = new Color(0.20f, 0.70f, 0.40f, 1.00f);

            [Header("State")]
            public Color disabled        = new Color(0.55f, 0.55f, 0.55f, 0.95f);
            public Color overlay         = new Color(0.00f, 0.00f, 0.00f, 0.55f);
            public Color inputBackground = new Color(1.00f, 1.00f, 1.00f, 0.12f);
            public Color inputPlaceholder = new Color(1.00f, 1.00f, 1.00f, 0.45f);
        }

        // ── Interaction ───────────────────────────────────────────────────────────────
        [Serializable]
        public class InteractionTokens
        {
            public Color buttonNormal      = new Color(0.20f, 0.55f, 0.85f, 1.00f);
            public Color buttonHighlighted = new Color(0.30f, 0.65f, 0.95f, 1.00f);
            public Color buttonPressed     = new Color(0.15f, 0.40f, 0.70f, 1.00f);
            public Color buttonDisabled    = new Color(0.55f, 0.55f, 0.55f, 0.95f);
        }

        // ── Layout ───────────────────────────────────────────────────────────────────
        [Serializable]
        public class LayoutTokens
        {
            [Tooltip("Height in pixels of the load-error banner")]
            public float bannerHeight = 120f;

            [Tooltip("Width/height in pixels of the back-confirm dialog panel")]
            public float dialogWidth  = 520f;
            public float dialogHeight = 240f;

            [Tooltip("Size of buttons inside dialogs")]
            public float dialogButtonWidth  = 160f;
            public float dialogButtonHeight = 44f;
        }
    }
}
