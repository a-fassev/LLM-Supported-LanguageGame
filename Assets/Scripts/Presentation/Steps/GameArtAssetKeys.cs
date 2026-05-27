using System.Text.RegularExpressions;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Canonical Resources paths under <c>Assets/Resources/UI/GameArt/</c> (load via <c>UI/GameArt/...</c>).
    /// JSON fields <see cref="SceneBackgroundAssetField"/> and <see cref="AssetIdField"/> store path segments after <c>GameArt/</c>.
    /// </summary>
    internal static class GameArtAssetKeys
    {
        private static readonly Regex GameArtKeyRegex = new(
            "^[a-z0-9/_-]+$",
            RegexOptions.Compiled);

        public const string ResourcesRoot = "UI/GameArt";

        public const string SceneBackgroundAssetField = "sceneBackgroundAsset";
        public const string AssetIdField = "assetId";
        public const string AudioAssetIdField = "audioAssetId";

        public const string DefaultTaskSceneBackgroundKey =
            "static/task-scene-backgrounds/ph-st-task-bg-default";

        public const string DefaultCutsceneSceneBackgroundKey =
            "static/cutscene-backgrounds/ph-st-cutscene-bg-default";

        public const string NavAuthSceneBackgroundKey =
            "static/navigation/backgrounds/ph-st-nav-auth-bg";

        public const string NavAuthLoginPanelBackgroundKey =
            "static/navigation/backgrounds/ph-st-nav-auth-login-panel";

        public const string NavAuthRegisterPanelBackgroundKey =
            "static/navigation/backgrounds/ph-st-nav-auth-register-panel";

        public const string NavMainMenuSceneBackgroundKey =
            "static/navigation/backgrounds/ph-st-nav-mainmenu-bg";

        public const string NavLeaderboardSceneBackgroundKey =
            "static/navigation/backgrounds/ph-st-nav-leaderboard-bg";

        public const string NavRefreshButtonBackgroundKey =
            "static/navigation/buttons/ph-st-nav-refresh-btn";

        public const string NavChapterSceneBackgroundKey =
            "static/navigation/backgrounds/ph-st-nav-chapter-bg";

        public const string NavQuestSceneBackgroundKey =
            "static/navigation/backgrounds/ph-st-nav-quest-bg";

        public const string NavAvatarShopSceneBackgroundKey =
            "static/navigation/backgrounds/ph-st-nav-avatar-shop-bg";

        public const string HudPizzaIconBackgroundKey = "static/hud/ph-st-hud-pizza-icon";

        public const string HudBackpackIconBackgroundKey = "static/hud/ph-st-hud-backpack-icon";

        public const string DefaultPlayerPortraitKey = "portraits/player/current";
        public const string NpcPortraitKeyPrefix = "portraits/npc/";

        /// <summary>Matches web <c>gameArtAssetKeySchema</c> (lowercase path segments under GameArt/).</summary>
        public static bool TryNormalizeGameArtKey(string raw, out string normalized)
        {
            normalized = null;
            if (string.IsNullOrWhiteSpace(raw))
                return false;

            var trimmed = raw.Trim().TrimStart('/').ToLowerInvariant();
            if (trimmed.Length == 0 || !GameArtKeyRegex.IsMatch(trimmed))
                return false;

            normalized = trimmed;
            return true;
        }

        public static string ToResourcesPath(string gameArtKey)
        {
            if (!TryNormalizeGameArtKey(gameArtKey, out var normalized))
                return null;

            return $"{ResourcesRoot}/{normalized}";
        }
    }
}
