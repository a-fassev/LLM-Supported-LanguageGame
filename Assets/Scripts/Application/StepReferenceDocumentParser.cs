using System;
using UnityEngine;

namespace LanguageGame.Application
{
    public static class StepReferenceDocumentParser
    {
        [Serializable]
        private sealed class StepReferenceDocumentEnvelope
        {
            public QuestReferenceDocumentDto referenceDocument;
        }

        public static QuestReferenceDocumentDto Parse(string contentJson)
        {
            if (string.IsNullOrWhiteSpace(contentJson))
                return null;

            var trimmed = contentJson.Trim();
            if (trimmed.Length == 0 || trimmed[0] != '{')
                return null;

            try
            {
                var envelope = JsonUtility.FromJson<StepReferenceDocumentEnvelope>(contentJson);
                return Sanitize(envelope?.referenceDocument);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[StepReferenceDocumentParser] Could not parse contentJson: {ex.Message}");
                return null;
            }
        }

        public static bool IsValid(QuestReferenceDocumentDto doc)
        {
            return doc != null &&
                   !string.IsNullOrWhiteSpace(doc.title) &&
                   !string.IsNullOrWhiteSpace(doc.bodyText);
        }

        private static QuestReferenceDocumentDto Sanitize(QuestReferenceDocumentDto doc)
        {
            if (!IsValid(doc))
                return null;

            doc.title = doc.title.Trim();
            if (!string.IsNullOrWhiteSpace(doc.buttonLabel))
                doc.buttonLabel = doc.buttonLabel.Trim();
            return doc;
        }
    }
}

