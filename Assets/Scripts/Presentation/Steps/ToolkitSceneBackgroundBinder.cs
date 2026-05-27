using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    internal static class ToolkitSceneBackgroundBinder
    {
        public const string SceneBackgroundHostName = "scene-background-host";

        private const string SceneBackgroundHostClass = "lg-scene-background-host";

        private const string SceneBgRootClass = "lg-scene-bg-root";

        /// <summary>Root uses USS preview only; per-step JSON paints <see cref="SceneBackgroundHostName"/>.</summary>
        private const string SceneBgHostDrivenClass = "lg-scene-bg-root--host-driven";

        private static readonly Regex SceneBackgroundAssetRegex = new(
            "\"sceneBackgroundAsset\"\\s*:\\s*\"([^\"]+)\"",
            RegexOptions.Compiled);

        public static void BindFromContentJson(VisualElement host, string contentJson, bool isCutsceneStep)
        {
            if (host == null)
                return;

            var raw = TryReadSceneBackgroundAsset(contentJson);
            var key = ResolveSceneBackgroundKey(raw, isCutsceneStep);
            ApplySceneBackground(host, key, syncSceneRoot: false);
        }

        /// <summary>
        /// Full-bleed scene layer. <paramref name="syncSceneRoot"/> true for static nav/shell defaults (root + host);
        /// false for per-step JSON (host only; root keeps USS shell default).
        /// </summary>
        public static void ApplySceneBackground(VisualElement host, string gameArtKey, bool syncSceneRoot = true)
        {
            if (host == null || !GameArtAssetKeys.TryNormalizeGameArtKey(gameArtKey, out var key))
                return;

            ApplyGameArtKey(host, key);

            if (IsSceneBackgroundHost(host))
                host.SendToBack();

            VisualElement sceneRoot = FindAncestorWithClass(host, SceneBgRootClass);
            if (sceneRoot == null || sceneRoot == host)
                return;

            if (syncSceneRoot)
            {
                sceneRoot.RemoveFromClassList(SceneBgHostDrivenClass);
                ApplyGameArtKey(sceneRoot, key);
                return;
            }

            sceneRoot.AddToClassList(SceneBgHostDrivenClass);
            sceneRoot.style.backgroundImage = StyleKeyword.Null;
        }

        /// <returns>True when a sprite was applied from Resources.</returns>
        public static bool ApplyGameArtKey(VisualElement target, string gameArtKey)
        {
            if (target == null)
                return false;

            if (!GameArtAssetKeys.TryNormalizeGameArtKey(gameArtKey, out var key))
            {
                LogInvalidKeyRejected(gameArtKey);
                target.style.backgroundImage = StyleKeyword.Null;
                return false;
            }

            var resourcePath = GameArtAssetKeys.ToResourcesPath(key);
            var sprite = GameArtResourceLoader.LoadSpriteByGameArtKey(key);
            if (sprite != null)
            {
                target.style.backgroundImage = new StyleBackground(sprite);
                target.style.backgroundSize = new BackgroundSize(BackgroundSizeType.Cover);
                return true;
            }

            target.style.backgroundImage = StyleKeyword.Null;
            LogMissingAsset(key, resourcePath);
            return false;
        }

        private static string ResolveSceneBackgroundKey(string rawFromJson, bool isCutsceneStep)
        {
            if (GameArtAssetKeys.TryNormalizeGameArtKey(rawFromJson, out var normalized))
                return normalized;

            if (!string.IsNullOrWhiteSpace(rawFromJson))
                LogInvalidSceneBackgroundKeyUsingFallback(rawFromJson);

            return isCutsceneStep
                ? GameArtAssetKeys.DefaultCutsceneSceneBackgroundKey
                : GameArtAssetKeys.DefaultTaskSceneBackgroundKey;
        }

        private static bool IsSceneBackgroundHost(VisualElement element) =>
            element != null
            && (element.ClassListContains(SceneBackgroundHostClass)
                || element.name == SceneBackgroundHostName);

        private static VisualElement FindAncestorWithClass(VisualElement start, string className)
        {
            for (var node = start?.parent; node != null; node = node.parent)
            {
                if (node.ClassListContains(className))
                    return node;
            }

            return null;
        }

        private static string TryReadSceneBackgroundAsset(string contentJson)
        {
            if (string.IsNullOrWhiteSpace(contentJson))
                return null;

            var trimmed = contentJson.TrimStart();
            if (!trimmed.StartsWith("{"))
                return null;

            var match = SceneBackgroundAssetRegex.Match(contentJson);
            if (match.Success)
                return match.Groups[1].Value.Trim();

            var probe = JsonUtility.FromJson<SceneBackgroundProbeDto>(contentJson);
            if (!string.IsNullOrWhiteSpace(probe?.sceneBackgroundAsset))
                return probe.sceneBackgroundAsset.Trim();

            return null;
        }

        private static void LogInvalidSceneBackgroundKeyUsingFallback(string raw)
        {
            Debug.LogWarning(
                $"[GameArt] Invalid sceneBackgroundAsset '{raw}' (expected lowercase path segments: a-z, 0-9, /, _, -). Using shell default.");
        }

        private static void LogInvalidKeyRejected(string raw)
        {
            Debug.LogWarning(
                $"[GameArt] Invalid asset key '{raw}' (expected lowercase path segments: a-z, 0-9, /, _, -). Skipped.");
        }

        private static void LogMissingAsset(string key, string resourcePath)
        {
            Debug.LogWarning(
                $"[GameArt] Missing Resources asset for key '{key}' (path: Resources/{resourcePath}). Check PNG under Assets/Resources/UI/GameArt/.");
        }

        [System.Serializable]
        private sealed class SceneBackgroundProbeDto
        {
            public string sceneBackgroundAsset;
        }
    }
}
