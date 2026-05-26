using System;

namespace LanguageGame.Application
{
    [Serializable]
    public sealed class QuestMetaPayloadDto
    {
        public QuestReferenceDocumentDto referenceDocument;
        public QuestFlowMetaDto flow;
    }

    [Serializable]
    public sealed class QuestReferenceDocumentDto
    {
        public string documentId;
        public string title;
        public string bodyText;
        public string buttonLabel;
    }

    [Serializable]
    public sealed class QuestFlowMetaDto
    {
        public bool blockBack;
        public string autoStartQuestSlug;
    }
}
