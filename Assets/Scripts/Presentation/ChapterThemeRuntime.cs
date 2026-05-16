using System;
using UnityEngine;

namespace LanguageGame.Presentation
{
    public static class ChapterThemeRuntime
    {
        [Serializable]
        private sealed class ThemePayload
        {
            public string paletteKey;
        }

        public static void Apply(string themeJson)
        {
            if (string.IsNullOrEmpty(themeJson))
                return;
            ThemePayload payload = null;
            try
            {
                payload = JsonUtility.FromJson<ThemePayload>(themeJson);
            }
            catch (Exception)
            {
                return;
            }

            if (payload == null || string.IsNullOrEmpty(payload.paletteKey))
                return;

            var themed = Resources.Load<UiDesignTokens>($"UI/{payload.paletteKey}");
            if (themed != null)
            {
                UiThemeProvider.SetTokens(themed);
                return;
            }

            var fallback = Resources.Load<UiDesignTokens>("UI/UiDesignTokens_Default");
            if (fallback != null)
            {
                UiThemeProvider.SetTokens(fallback);
                Debug.LogWarning(
                    $"[ChapterThemeRuntime] Missing Resources/UI/{payload.paletteKey}; applied UiDesignTokens_Default instead.");
                return;
            }

            Debug.LogWarning(
                $"[ChapterThemeRuntime] No UiDesignTokens at Resources/UI/{payload.paletteKey} or UI/UiDesignTokens_Default (paletteKey={payload.paletteKey}).");
        }
    }
}
