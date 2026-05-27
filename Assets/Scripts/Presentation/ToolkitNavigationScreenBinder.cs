using LanguageGame.Presentation.Steps;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Applies static GameArt backgrounds to navigation screens at runtime (USS provides UI Builder preview).</summary>
    internal static class ToolkitNavigationScreenBinder
    {
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
