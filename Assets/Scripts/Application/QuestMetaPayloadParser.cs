using System;
using UnityEngine;

namespace LanguageGame.Application
{
    public static class QuestMetaPayloadParser
    {
        public static QuestMetaPayloadDto Parse(string metaJson)
        {
            if (string.IsNullOrWhiteSpace(metaJson))
                return new QuestMetaPayloadDto();

            var trimmed = metaJson.TrimStart();
            if (trimmed.Length == 0 || trimmed[0] != '{')
                return new QuestMetaPayloadDto();

            try
            {
                var dto = JsonUtility.FromJson<QuestMetaPayloadDto>(metaJson);
                return dto ?? new QuestMetaPayloadDto();
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[QuestMetaPayloadParser] Could not parse metaJson: {ex.Message}");
                return new QuestMetaPayloadDto();
            }
        }

        public static bool HasReferenceDocument(QuestMetaPayloadDto meta)
        {
            return meta?.referenceDocument != null &&
                   !string.IsNullOrWhiteSpace(meta.referenceDocument.bodyText);
        }
    }
}
