using System;
using UnityEngine;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Serializable payloads for <see cref="JsonUtility"/> parsing of server <c>contentJson</c>.
    /// Field names align with JSON keys emitted by authoring / APIs.
    /// </summary>

    [Serializable]
    public sealed class ClozeTextContentDto
    {
        public string prompt;
        public bool caseSensitive;
        public ClozeLineDto[] lines;
    }

    [Serializable]
    public sealed class ClozeLineDto
    {
        public ClozeSegmentDto[] segments;
    }

    [Serializable]
    public sealed class ClozeSegmentDto
    {
        public string kind;
        public string text;
        public string placeholder;
        public int maxLength;
        public string ignoreCase;
        public string[] correctAnswers;
    }

    [Serializable]
    public sealed class MultipleChoiceContentDto
    {
        public string prompt;
        public string subtitle;
        public string selectionMode;
        public bool preserveOptionOrder;
        public StemBlockDto[] stem;
        public McOptionDto[] options;
        public string[] correctOptionIds;
        public MultipleChoiceQuestionDto[] questions;
    }

    [Serializable]
    public sealed class MultipleChoiceQuestionDto
    {
        public string id;
        public string selectionMode;
        public bool preserveOptionOrder;
        public StemBlockDto[] stem;
        public McOptionDto[] options;
        public string[] correctOptionIds;
    }

    [Serializable]
    public sealed class McOptionDto
    {
        public string id;
        public string label;
        public string imageUrl;
    }

    [Serializable]
    public sealed class StemBlockDto
    {
        public string kind;
        public string text;
        public string imageUrl;
        public string audioUrl;
    }

    [Serializable]
    public sealed class DragDropContentDto
    {
        public string prompt;
        public string subtitle;
        public DragDropItemDto[] items;
        public DragDropTargetDto[] targets;
        public DragDropPresentationDto presentation;
        public DragDropLineDto[] lines;
        public bool shuffleItemOrder;
        public bool requireBankEmpty;
    }

    [Serializable]
    public sealed class DragDropPresentationDto
    {
        public string targetMode;
        public string sourceLabel;
        public string targetLabel;
    }

    [Serializable]
    public sealed class DragDropTargetDto
    {
        public string id;
        public string title;
        public string[] correctItemIds;
    }

    [Serializable]
    public sealed class DragDropItemDto
    {
        public string id;
        public string label;
        public string imageUrl;
    }

    [Serializable]
    public sealed class DragDropLineDto
    {
        public DragDropSegmentDto[] segments;
    }

    [Serializable]
    public sealed class DragDropSegmentDto
    {
        public string kind;
        public string text;
        public string targetId;
    }
}
