using System;
using System.Collections.Generic;
using UnityEngine;

namespace LanguageGame.Application
{
    public static class QuestMetaPayloadParser
    {
        private static readonly HashSet<string> AllowedTopLevelKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "referenceDocument",
            "flow",
        };

        public static QuestMetaPayloadDto Parse(string metaJson)
        {
            if (string.IsNullOrWhiteSpace(metaJson))
                return new QuestMetaPayloadDto();

            var trimmed = metaJson.Trim();
            if (trimmed.Length == 0 || trimmed[0] != '{')
                return new QuestMetaPayloadDto();

            try
            {
                var dto = JsonUtility.FromJson<QuestMetaPayloadDto>(metaJson);
                return Sanitize(dto ?? new QuestMetaPayloadDto(), trimmed);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[QuestMetaPayloadParser] Could not parse metaJson: {ex.Message}");
                return new QuestMetaPayloadDto();
            }
        }

        private static QuestMetaPayloadDto Sanitize(QuestMetaPayloadDto dto, string rawJson)
        {
            var issues = new List<string>();

            if (dto.referenceDocument != null)
            {
                var doc = dto.referenceDocument;
                var titleOk = !string.IsNullOrWhiteSpace(doc.title);
                var bodyOk = !string.IsNullOrWhiteSpace(doc.bodyText);
                if (!titleOk || !bodyOk)
                {
                    issues.Add("referenceDocument requires non-empty title and bodyText");
                    dto.referenceDocument = null;
                }
            }

            if (dto.flow != null && string.IsNullOrWhiteSpace(dto.flow.autoStartQuestSlug))
                dto.flow.autoStartQuestSlug = null;

            if (TryGetUnknownTopLevelKey(rawJson, out var unknownKey))
                issues.Add($"unknown top-level key '{unknownKey}'");

            if (issues.Count == 0 && rawJson != "{}" && !RawJsonHasRecognizedKeys(rawJson))
                issues.Add("no recognized meta_payload fields");

            if (issues.Count > 0)
            {
                Debug.LogWarning(
                    "[QuestMetaPayloadParser] Invalid meta_payload stripped to empty object: " +
                    string.Join("; ", issues));
                return new QuestMetaPayloadDto();
            }

            return dto;
        }

        private static bool RawJsonHasRecognizedKeys(string json)
        {
            return json.IndexOf("\"referenceDocument\"", StringComparison.OrdinalIgnoreCase) >= 0
                   || json.IndexOf("\"flow\"", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private static bool TryGetUnknownTopLevelKey(string json, out string unknownKey)
        {
            unknownKey = null;
            foreach (var key in ExtractTopLevelKeys(json))
            {
                if (!AllowedTopLevelKeys.Contains(key))
                {
                    unknownKey = key;
                    return true;
                }
            }

            return false;
        }

        private static IEnumerable<string> ExtractTopLevelKeys(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                yield break;

            var depth = 0;
            var inString = false;
            var escape = false;
            var keyStart = -1;

            for (var i = 0; i < json.Length; i++)
            {
                var c = json[i];
                if (inString)
                {
                    if (escape)
                    {
                        escape = false;
                        continue;
                    }

                    if (c == '\\')
                    {
                        escape = true;
                        continue;
                    }

                    if (c == '"')
                    {
                        if (depth == 1 && keyStart >= 0)
                            yield return json.Substring(keyStart, i - keyStart);
                        inString = false;
                        keyStart = -1;
                    }

                    continue;
                }

                if (c == '"')
                {
                    inString = true;
                    if (depth == 1)
                        keyStart = i + 1;
                    continue;
                }

                if (c == '{')
                {
                    depth++;
                    continue;
                }

                if (c == '}')
                {
                    if (depth == 1)
                        yield break;
                    depth--;
                }
            }
        }

        public static bool HasReferenceDocument(QuestMetaPayloadDto meta)
        {
            return meta?.referenceDocument != null &&
                   !string.IsNullOrWhiteSpace(meta.referenceDocument.bodyText);
        }
    }
}
