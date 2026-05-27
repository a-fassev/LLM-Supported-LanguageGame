using LanguageGame.Presentation.Steps;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Applies static GameArt backgrounds to navigation screens at runtime (UI Builder preview uses same keys).</summary>
    internal static class ToolkitNavigationScreenBinder
    {
        public static void ApplyAuthScreen(VisualElement root)
        {
            ApplyKey(root, ToolkitSceneBackgroundBinder.SceneBackgroundHostName,
                "static/navigation/backgrounds/ph-st-nav-auth-bg");
            ApplyKey(root, "login-panel", "static/navigation/backgrounds/ph-st-nav-auth-login-panel");
            ApplyKey(root, "register-panel", "static/navigation/backgrounds/ph-st-nav-auth-register-panel");
        }

        public static void ApplyMainMenuScreen(VisualElement root)
        {
            ApplyKey(root, ToolkitSceneBackgroundBinder.SceneBackgroundHostName,
                "static/navigation/backgrounds/ph-st-nav-mainmenu-bg");
        }

        public static void ApplyLeaderboardScreen(VisualElement root)
        {
            ApplyKey(root, ToolkitSceneBackgroundBinder.SceneBackgroundHostName,
                "static/navigation/backgrounds/ph-st-nav-leaderboard-bg");
            ApplyKey(root, "refresh-button", "static/navigation/buttons/ph-st-nav-refresh-btn");
        }

        public static void ApplyChapterOverviewScreen(VisualElement root)
        {
            ApplyKey(root, ToolkitSceneBackgroundBinder.SceneBackgroundHostName,
                "static/navigation/backgrounds/ph-st-nav-chapter-bg");
        }

        public static void ApplyQuestOverviewScreen(VisualElement root)
        {
            ApplyKey(root, ToolkitSceneBackgroundBinder.SceneBackgroundHostName,
                "static/navigation/backgrounds/ph-st-nav-quest-bg");
        }

        public static void ApplyAvatarShopScreen(VisualElement root)
        {
            ApplyKey(root, ToolkitSceneBackgroundBinder.SceneBackgroundHostName,
                "static/navigation/backgrounds/ph-st-nav-avatar-shop-bg");
        }

        private static void ApplyKey(VisualElement root, string elementName, string gameArtKey)
        {
            var host = root.Q<VisualElement>(elementName);
            if (host == null)
                return;
            ToolkitSceneBackgroundBinder.ApplyGameArtKey(host, gameArtKey);
        }
    }
}
