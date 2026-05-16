using UnityEngine;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Persists on the <c>GameFlow</c> object alongside <c>GameFlowController</c> and exposes
    /// <see cref="UiDesignTokens"/> to all presentation views via a static singleton.
    ///
    /// Assign the default token asset in the Inspector. If the field is left empty the provider
    /// will attempt to load <c>Resources/UI/UiDesignTokens_Default</c> as a fallback.
    /// </summary>
    public class UiThemeProvider : MonoBehaviour
    {
        public static UiThemeProvider Instance { get; private set; }

        [SerializeField] private UiDesignTokens _tokens;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only this component, not the whole GameFlow GameObject.
                Destroy(this);
                return;
            }

            Instance = this;

            if (_tokens == null)
                _tokens = Resources.Load<UiDesignTokens>("UI/UiDesignTokens_Default");

            if (_tokens == null)
                Debug.LogWarning("[UiThemeProvider] No UiDesignTokens asset assigned or found at " +
                                 "Resources/UI/UiDesignTokens_Default. UI runtime builders will use inline fallback values.");
        }

        private void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

        /// <summary>
        /// Retrieves the active token asset. Returns <c>false</c> (with <c>tokens == null</c>) when
        /// no provider is present or the asset is not set — callers must apply safe inline defaults.
        /// </summary>
        public static bool TryGet(out UiDesignTokens tokens)
        {
            tokens = Instance != null ? Instance._tokens : null;
            return tokens != null;
        }

        public static void SetTokens(UiDesignTokens tokens)
        {
            if (Instance == null || tokens == null)
                return;
            Instance._tokens = tokens;
        }
    }
}
