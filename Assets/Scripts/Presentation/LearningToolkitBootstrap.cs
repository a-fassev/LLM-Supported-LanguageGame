using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using UnityEngine.UIElements;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem.UI;
#endif

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Spawns <see cref="UIDocument"/> instances for migrated menu/overview screens without keeping dual Canvas stacks alive.
    /// </summary>
    internal static class LearningToolkitBootstrap
    {
        public const string PanelSettingsResourcesPath = "UI/LearningMenusPanelSettings";

        private const string MenusThemeResourcePath = "UI/LearningToolkit/LearningMenusTheme";

        private static readonly string PanelTextSettingsResourcePath = "UI/LearningMenusPanelTextSettings";

        private static PanelSettings _runtimeMenusPanel;

        private static ThemeStyleSheet _cachedMenusThemeStyle;

        /// <summary>Runtime clone of <see cref="PanelSettings"/> with theme/fonts configured; avoids mutating the committed asset.</summary>
        private static PanelSettings ResolveMenusRuntimePanelSettings()
        {
            if (_runtimeMenusPanel != null)
                return _runtimeMenusPanel;

            var source = Resources.Load<PanelSettings>(PanelSettingsResourcesPath);
            if (source == null)
            {
                Debug.LogError(
                    "[LearningToolkitBootstrap] Missing PanelSettings at Resources/" + PanelSettingsResourcesPath +
                    " (LearningMenusPanelSettings asset). Menus UITK cannot render correctly.");
                return null;
            }

            _runtimeMenusPanel = Object.Instantiate(source);
            ApplyMenusThemeStyleSheet(_runtimeMenusPanel);

            PanelTextSettings textOverride = Resources.Load<PanelTextSettings>(PanelTextSettingsResourcePath);
            if (_runtimeMenusPanel.textSettings == null && textOverride != null)
                _runtimeMenusPanel.textSettings = textOverride;

            if (_runtimeMenusPanel.textSettings == null)
                Debug.LogError(
                    "[LearningToolkitBootstrap] UITK Text Settings asset missing — expected Resources/UI/LearningMenusPanelTextSettings. " +
                    "Open the Unity Editor once (auto-import creates it) or use menu Language Game/UITK/Ensure menus text settings.");

            return _runtimeMenusPanel;
        }

        private static ThemeStyleSheet LoadMenusThemeStyleSheet()
        {
            if (_cachedMenusThemeStyle != null)
                return _cachedMenusThemeStyle;

            var theme = Resources.Load<ThemeStyleSheet>(MenusThemeResourcePath);
            if (theme == null)
                Debug.LogError(
                    "[LearningToolkitBootstrap] Missing Theme Style Sheet at Resources/" + MenusThemeResourcePath +
                    " (LearningMenusTheme.tss importing unity-theme default + theme-learn).");

            return _cachedMenusThemeStyle = theme;
        }

        private static void ApplyMenusThemeStyleSheet(PanelSettings panel)
        {
            if (panel == null)
                return;

            ThemeStyleSheet themeStyle = LoadMenusThemeStyleSheet();
            if (themeStyle != null && panel.themeStyleSheet == null)
                panel.themeStyleSheet = themeStyle;
        }

        public static PanelSettings LoadPanelSettings() =>
            ResolveMenusRuntimePanelSettings();

        public static VisualTreeAsset LoadLayout(string nameWithoutExtension) =>
            Resources.Load<VisualTreeAsset>($"UI/LearningToolkit/{nameWithoutExtension}");

        /// <summary>Disables an authored Canvas (if present) without deactivating the hosting GameObject (scripts stay alive).</summary>
        public static void DisableHostedCanvas(Component owner)
        {
            var canvas = owner.GetComponent<Canvas>();
            if (canvas != null)
                canvas.enabled = false;

            foreach (var raycaster in owner.GetComponents<GraphicRaycaster>())
                raycaster.enabled = false;
        }

        /// <summary>
        /// Creates a hierarchical <see cref="UIDocument"/>. Returns <c>null</c> if required assets fail to load; callers must disable behaviour or degrade gracefully.
        /// </summary>
        public static UIDocument SpawnUiDocument(MonoBehaviour owner, string layoutNameWithoutExtension)
        {
            DisableHostedCanvas(owner);

            PanelSettings panel = ResolveMenusRuntimePanelSettings();
            if (panel == null)
                return null;

            VisualTreeAsset vta = LoadLayout(layoutNameWithoutExtension);
            if (vta == null)
            {
                Debug.LogError(
                    $"[LearningToolkitBootstrap] Missing UXML/VTree at Resources/UI/LearningToolkit/{layoutNameWithoutExtension}.");
                return null;
            }

            EnsureEventSystem();

            var rootTransform = owner.transform.root;
            var go = new GameObject($"LearningToolkit_{layoutNameWithoutExtension}");
            go.transform.SetParent(rootTransform, worldPositionStays: false);

            var doc = go.AddComponent<UIDocument>();
            doc.panelSettings = panel;
            doc.visualTreeAsset = vta;
            doc.sortingOrder = short.MaxValue;

            return doc;
        }

        internal static VisualElement ResolveOverlayPlane(UIDocument doc)
        {
            if (doc?.rootVisualElement == null)
                return null;

            return doc.rootVisualElement.Q<VisualElement>("overlay-plane");
        }

        public static void EnsureEventSystem()
        {
            if (Object.FindAnyObjectByType<EventSystem>() != null)
                return;

            var es = new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM
            es.AddComponent<InputSystemUIInputModule>();
#else
            es.AddComponent<StandaloneInputModule>();
#endif
        }
    }
}
