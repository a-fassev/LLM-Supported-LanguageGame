namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Canonical Resources paths under <c>Assets/Resources/UI/GameArt/</c> (load via <c>UI/GameArt/...</c>).
    /// JSON fields <see cref="SceneBackgroundAssetField"/> and <see cref="AssetIdField"/> store path segments after <c>GameArt/</c>.
    /// </summary>
    internal static class GameArtAssetKeys
    {
        public const string ResourcesRoot = "UI/GameArt";

        public const string SceneBackgroundAssetField = "sceneBackgroundAsset";
        public const string AssetIdField = "assetId";
        public const string AudioAssetIdField = "audioAssetId";

        public const string DefaultTaskSceneBackgroundKey =
            "static/task-scene-backgrounds/ph-st-task-bg-default";

        public const string DefaultCutsceneSceneBackgroundKey =
            "static/cutscene-backgrounds/ph-st-cutscene-bg-default";

        public const string DefaultPlayerPortraitKey = "portraits/player/current";
        public const string NpcPortraitKeyPrefix = "portraits/npc/";

        public static string ToResourcesPath(string gameArtKey)
        {
            if (string.IsNullOrWhiteSpace(gameArtKey))
                return null;
            var trimmed = gameArtKey.Trim().TrimStart('/');
            return $"{ResourcesRoot}/{trimmed}";
        }
    }
}
