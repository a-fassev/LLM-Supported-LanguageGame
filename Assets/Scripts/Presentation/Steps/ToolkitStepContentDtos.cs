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

    /// <summary>Freitext task scored by backend LLM; mirrors <c>FreitextLlm</c> <c>content_payload</c> JSON.</summary>
    [Serializable]
    public sealed class FreitextLlmContentDto
    {
        public string prompt;
        public string instruction;
        public string targetLanguage;

        /// <summary>Show optional word-counter hint beneath the learner textarea.</summary>
        public bool showWordCount;

        /// <summary>Show optional character-counter hint beneath the learner textarea.</summary>
        public bool showCharacterCount;
        public int minWords;
        public int maxWords;
        public FreitextLlmEvaluationPayloadDto evaluation;
    }

    [Serializable]
    public sealed class FreitextLlmEvaluationPayloadDto
    {
        public float grammarWeight;
        public float vocabularyWeight;
        public float registerWeight;
        public float passThreshold;

        /// <summary>Formal, informal, or neutral register guidance for the scorer.</summary>
        public string registerTarget;

        public string scoringPolicy;
        public int maxPoints;

        /// <summary>Optional authoring override — server merges defaults when null/empty.</summary>
        public string[] evaluationCriteria;

        public string[] targetStructures;
    }

    /// <summary>Error-spotting task: learner selects incorrect tokens and types corrections (authoritative check client-side).</summary>
    [Serializable]
    public sealed class ErrorSpottingContentDto
    {
        public string prompt;
        public string instruction;

        /// <summary>
        /// Optional learner-facing line above the text (e.g. localized counter hint). When empty,
        /// the step uses a default Italian caption with the exact number of authored errors only.
        /// </summary>
        public string counterCaption;

        public ErrorSpottingExpectedRangeDto expectedErrorRange;
        public ErrorSpottingSegmentDto[] segments;
    }

    [Serializable]
    public sealed class ErrorSpottingExpectedRangeDto
    {
        public int min;

        /// <summary>Inclusive upper bound for how many mistakes exist in this exercise.</summary>
        public int max;
    }

    [Serializable]
    public sealed class ErrorSpottingSegmentDto
    {
        public string id;
        public string text;
        public bool isError;

        /// <summary>Case-insensitive, whitespace-normalised match versus learner typed correction.</summary>
        public string[] acceptedCorrections;

        /// <summary>Optional authoring hint/tooltip shown when the segment is selected.</summary>
        public string hint;
    }
}
