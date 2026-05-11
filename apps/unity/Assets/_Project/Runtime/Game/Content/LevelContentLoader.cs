using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Game.Content
{
    public sealed class LevelContentLoader
    {
        private readonly ContentValidator _validator;

        public LevelContentLoader(ContentValidator validator)
        {
            _validator = validator;
        }

        public LevelContentLoadResult Load(string levelId, string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
            {
                return LevelContentLoadResult.Fail($"No content path configured for level '{levelId}'.");
            }

            string normalizedPath = NormalizeRelativePath(relativePath);
            string json;
            if (!TryLoadFromResources(normalizedPath, out json))
            {
#if UNITY_WEBGL && !UNITY_EDITOR
                return LevelContentLoadResult.Fail($"Content file not found in Resources: {relativePath}");
#else
                try
                {
                    string absolutePath = Path.Combine(Application.dataPath, normalizedPath);
                    if (!File.Exists(absolutePath))
                    {
                        return LevelContentLoadResult.Fail(
                            $"Content file not found: {relativePath}. Also missing matching Resources TextAsset.");
                    }

                    json = File.ReadAllText(absolutePath);
                }
                catch (Exception exception)
                {
                    return LevelContentLoadResult.Fail($"Failed to read level content: {exception.Message}");
                }
#endif
            }

            if (string.IsNullOrWhiteSpace(json))
            {
                return LevelContentLoadResult.Fail("Level content file is empty.");
            }

            LevelContentDocument document;
            try
            {
                document = JsonUtility.FromJson<LevelContentDocument>(json);
            }
            catch (Exception exception)
            {
                return LevelContentLoadResult.Fail($"Failed to parse level content JSON: {exception.Message}");
            }

            ContentValidationResult validation = _validator.Validate(document);
            if (!validation.IsValid)
            {
                return LevelContentLoadResult.Fail(validation.Message);
            }

            return LevelContentLoadResult.Success(document);
        }

        private static bool TryLoadFromResources(string normalizedPath, out string json)
        {
            json = string.Empty;
            if (string.IsNullOrWhiteSpace(normalizedPath))
            {
                return false;
            }

            foreach (string resourceKey in BuildResourceCandidates(normalizedPath))
            {
                TextAsset textAsset = Resources.Load<TextAsset>(resourceKey);
                if (textAsset != null && !string.IsNullOrWhiteSpace(textAsset.text))
                {
                    json = textAsset.text;
                    return true;
                }
            }

            return false;
        }

        private static string NormalizeRelativePath(string relativePath)
        {
            return relativePath.Trim().TrimStart('/').Replace('\\', '/');
        }

        private static IEnumerable<string> BuildResourceCandidates(string normalizedPath)
        {
            List<string> candidates = new();
            AddCandidate(candidates, StripJsonExtension(normalizedPath));

            if (normalizedPath.StartsWith("Assets/", StringComparison.OrdinalIgnoreCase))
            {
                AddCandidate(candidates, StripJsonExtension(normalizedPath.Substring("Assets/".Length)));
            }

            if (normalizedPath.StartsWith("_Project/", StringComparison.OrdinalIgnoreCase))
            {
                AddCandidate(candidates, StripJsonExtension(normalizedPath.Substring("_Project/".Length)));
            }

            int contentMarkerIndex = normalizedPath.IndexOf("/Content/", StringComparison.OrdinalIgnoreCase);
            if (contentMarkerIndex >= 0)
            {
                AddCandidate(candidates, StripJsonExtension(normalizedPath.Substring(contentMarkerIndex + 1)));
            }

            return candidates;
        }

        private static string StripJsonExtension(string path)
        {
            return path.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
                ? path.Substring(0, path.Length - ".json".Length)
                : path;
        }

        private static void AddCandidate(List<string> candidates, string candidate)
        {
            if (!string.IsNullOrWhiteSpace(candidate) && !candidates.Contains(candidate))
            {
                candidates.Add(candidate);
            }
        }
    }
}
