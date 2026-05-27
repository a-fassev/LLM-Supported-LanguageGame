using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    internal static class ToolkitSceneBackgroundBinder
    {
        public const string SceneBackgroundHostName = "scene-background-host";

        private static readonly Regex SceneBackgroundAssetRegex = new(
            "\"sceneBackgroundAsset\"\\s*:\\s*\"([^\"]+)\"",
            RegexOptions.Compiled);

        public static void BindFromContentJson(VisualElement host, string contentJson, bool isCutsceneStep)
        {
            if (host == null)
                return;

            var key = TryReadSceneBackgroundAsset(contentJson);
            if (string.IsNullOrWhiteSpace(key))
            {
                key = isCutsceneStep
                    ? GameArtAssetKeys.DefaultCutsceneSceneBackgroundKey
                    : GameArtAssetKeys.DefaultTaskSceneBackgroundKey;
            }

            ApplyGameArtKey(host, key);
        }

        public static void ApplyGameArtKey(VisualElement host, string gameArtKey)
        {
            if (host == null)
                return;

            var sprite = GameArtResourceLoader.LoadSpriteByGameArtKey(gameArtKey);
            if (sprite != null)
            {
                host.style.backgroundImage = new StyleBackground(sprite);
                host.AddToClassList("lg-scene-background-host--loaded");
                host.RemoveFromClassList("lg-scene-background-host--placeholder");
                return;
            }

            host.style.backgroundImage = StyleKeyword.Null;
            host.AddToClassList("lg-scene-background-host--placeholder");
            host.RemoveFromClassList("lg-scene-background-host--loaded");
        }

        private static string TryReadSceneBackgroundAsset(string contentJson)
        {
            if (string.IsNullOrWhiteSpace(contentJson))
                return null;

            var trimmed = contentJson.TrimStart();
            if (!trimmed.StartsWith("{"))
                return null;

            var probe = JsonUtility.FromJson<SceneBackgroundProbeDto>(contentJson);
            if (!string.IsNullOrWhiteSpace(probe?.sceneBackgroundAsset))
                return probe.sceneBackgroundAsset.Trim();

            var match = SceneBackgroundAssetRegex.Match(contentJson);
            return match.Success ? match.Groups[1].Value.Trim() : null;
        }

        [System.Serializable]
        private sealed class SceneBackgroundProbeDto
        {
            public string sceneBackgroundAsset;
        }
    }
}
