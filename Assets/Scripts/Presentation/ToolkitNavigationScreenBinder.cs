using System.Collections.Generic;
using LanguageGame.Presentation.Steps;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Applies static GameArt backgrounds to navigation screens at runtime (USS provides UI Builder preview).</summary>
    internal static class ToolkitNavigationScreenBinder
    {
        /// <summary>
        /// <see cref="ui:Instance"/> attribute overrides can duplicate <c>title-label</c> outside <c>title-host</c>; remove extras.
        /// </summary>
        public static void PruneDuplicateNavigationHeaderTitleLabels(VisualElement root)
        {
            var header = root?.Q<VisualElement>("navigation-page-header-part");
            if (header == null)
                return;

            var titleHost = header.Q<VisualElement>("title-host");
            if (titleHost == null)
                return;

            var extras = new List<Label>();
            header.Query<Label>("title-label").ForEach(label =>
            {
                if (!titleHost.Contains(label))
                    extras.Add(label);
            });

            foreach (Label label in extras)
                label.RemoveFromHierarchy();
        }

        /// <summary>Resolves the canonical page title label inside the navigation header part.</summary>
        public static Label ResolveNavigationPageTitleLabel(VisualElement root)
        {
            PruneDuplicateNavigationHeaderTitleLabels(root);
            return root?.Q<VisualElement>("navigation-page-header-part")?.Q<VisualElement>("title-host")
                       ?.Q<Label>("title-label")
                   ?? root?.Q<Label>("title-label");
        }

        public static void ApplyAuthScreen(VisualElement root)
        {
            ApplySceneKey(root, GameArtAssetKeys.NavAuthSceneBackgroundKey);
            ApplyDecorKey(root, "login-panel", GameArtAssetKeys.NavAuthLoginPanelBackgroundKey);
            ApplyDecorKey(root, "register-panel", GameArtAssetKeys.NavAuthRegisterPanelBackgroundKey);
        }

        public static void ApplyMainMenuScreen(VisualElement root)
        {
            ApplySceneKey(root, GameArtAssetKeys.NavMainMenuSceneBackgroundKey);
        }

        public static void ApplyLeaderboardScreen(VisualElement root)
        {
            ApplySceneKey(root, GameArtAssetKeys.NavLeaderboardSceneBackgroundKey);
            ApplyDecorKey(root, "refresh-button", GameArtAssetKeys.NavRefreshButtonBackgroundKey);
        }

        public static void ApplyChapterOverviewScreen(VisualElement root)
        {
            ApplySceneKey(root, GameArtAssetKeys.NavChapterSceneBackgroundKey);
        }

        public static void ApplyQuestOverviewScreen(VisualElement root)
        {
            ApplySceneKey(root, GameArtAssetKeys.NavQuestSceneBackgroundKey);
        }

        public static void ApplyAvatarShopScreen(VisualElement root)
        {
            ApplySceneKey(root, GameArtAssetKeys.NavAvatarShopSceneBackgroundKey);
        }

        public static void ApplyTaskShellDefaults(VisualElement root)
        {
            ApplySceneKey(root, GameArtAssetKeys.DefaultTaskSceneBackgroundKey);
        }

        public static void ApplyCutsceneShellDefaults(VisualElement root)
        {
            ApplySceneKey(root, GameArtAssetKeys.DefaultCutsceneSceneBackgroundKey);
        }

        private static void ApplySceneKey(VisualElement root, string gameArtKey)
        {
            if (root == null)
                return;

            var host = root.Q<VisualElement>(ToolkitSceneBackgroundBinder.SceneBackgroundHostName);
            if (host == null)
                return;

            ToolkitSceneBackgroundBinder.ApplySceneBackground(host, gameArtKey, syncSceneRoot: true);
        }

        private static void ApplyDecorKey(VisualElement root, string elementName, string gameArtKey)
        {
            if (root == null)
                return;

            var target = root.Q<VisualElement>(elementName);
            if (target == null)
                return;

            ToolkitSceneBackgroundBinder.ApplyGameArtKey(target, gameArtKey);
        }
    }
}
