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

    /// <summary>
    /// Cutscene step payload: mirrors v1 <c>contentJson</c> for <c>step_kind = cutscene</c>.
    /// Optional fields may be empty; <see cref="CutsceneToolkitStep"/> hides unused UI slots.
    /// </summary>
    [Serializable]
    public sealed class CutsceneContentDto
    {
        public int schemaVersion;
        public string title;
        public string body;
        public string subtitle;
        public string illustrationId;
        public string tone;
        public string ariaNote;
        public string primaryCtaLabel;
    }

    /// <summary>
    /// Special-screen task (<c>SpecialScreen*</c> server <c>task_type</c>): chrome + ordered embedded mechanics.
    /// Parsed with <see cref="UnityEngine.JsonUtility"/> from server <c>contentJson</c>.
    /// </summary>
    [Serializable]
    public sealed class SpecialScreenContentDto
    {
        /// <summary>
        /// Authoring hint for frame/layout variants (e.g. sms, mail, photo, reader); UI-specific skins may branch on this.</summary>
        public string screenVariant;

        public string title;
        public string subtitle;

        /// <summary>
        /// Optional SMS / messenger chrome: status bar + chat transcript. When combined with <c>SpecialScreenSms</c>
        /// or <c>screenVariant</c> <c>sms</c>/<c>whatsapp</c>, the host renders a phone mockup and embeds mechanics
        /// in the bubble that references the current block index via <see cref="SpecialScreenChatMessageDto.hostsEmbeddedMechanic"/>.
        /// </summary>
        public SpecialScreenSmsChromeDto smsChrome;

        /// <summary>
        /// Zeitschrift-/Buch-reader chrome: static illustration + scrollable prose (optional two columns, optional line numbers).
        /// Used with <c>taskType</c> <c>SpecialScreenReader</c> or <c>screenVariant</c> <c>reader</c>.
        /// </summary>
        public SpecialScreenReaderChromeDto readerChrome;

        /// <summary>Ordered blocks shown sequentially inside one shell step.</summary>
        public SpecialScreenBlockDto[] blocks;
    }

    /// <summary>Reader/magazine layout chrome for <see cref="SpecialScreenContentDto"/> (JsonUtility field names match JSON keys).</summary>
    [Serializable]
    public sealed class SpecialScreenReaderChromeDto
    {
        /// <summary>Optional hero image (absolute http/https).</summary>
        public string imageUrl;

        /// <summary>Article title inside the reader panel (optional; falls back to root <c>title</c>).</summary>
        public string headline;

        /// <summary>Optional subline under the headline (falls back to root <c>subtitle</c>).</summary>
        public string subheadline;

        /// <summary>Long reading text; newlines preserved.</summary>
        public string bodyText;

        /// <summary>
        /// <c>1</c> or <c>2</c> text columns. Values outside that range default to <c>2</c> for magazine-style layout.
        /// When <see cref="showLineNumbers"/> is true, Unity uses a single column regardless.
        /// </summary>
        public int columnCount;

        /// <summary>
        /// When true, prefix each textual line with a monotonic index (Bücher/Auszüge — line references).
        /// Implies single-column layout in the client.
        /// </summary>
        public bool showLineNumbers;
    }

    /// <summary>Messenger-style status bar + chat list for special screens (JsonUtility field names match JSON keys).</summary>
    [Serializable]
    public sealed class SpecialScreenSmsChromeDto
    {
        public SpecialScreenSmsStatusBarDto statusBar;

        /// <summary>Shown in the in-phone header (e.g. NPC or group name).</summary>
        public string chatHeaderTitle;

        public SpecialScreenChatMessageDto[] messages;
    }

    [Serializable]
    public sealed class SpecialScreenSmsStatusBarDto
    {
        /// <summary>Clock text (atmosphere only).</summary>
        public string timeText;

        /// <summary>Short reception / network hint (e.g. LTE, signal dots).</summary>
        public string signalHint;
    }

    [Serializable]
    public sealed class SpecialScreenChatMessageDto
    {
        /// <summary><c>incoming</c> (NPC / left) or <c>outgoing</c> (player / right), case-insensitive.</summary>
        public string direction;

        /// <summary>Optional small caption above bubble text.</summary>
        public string author;

        /// <summary>Optional preview line while another «part» is active; if omitted and this row hosts a mechanic for another block, Unity shows a muted placeholder («…»).</summary>
        public string text;

        /// <summary>
        /// When true, this bubble hosts the mechanic for <see cref="embeddedMechanicBlockIndex"/> (0-based index into <c>blocks</c>);
        /// must match the currently active block part when that part is shown.
        /// </summary>
        public bool hostsEmbeddedMechanic;

        /// <summary>
        /// Index into root <c>blocks</c> when <see cref="hostsEmbeddedMechanic"/> is true.
        /// Unity <see cref="UnityEngine.JsonUtility"/> treats omitted integers as <c>0</c>; always author this field explicitly when embedding any block other than the first.
        /// </summary>
        public int embeddedMechanicBlockIndex;
    }

    /// <summary>
    /// One mechanic embedded in a special screen. Exactly one nested payload field should be populated for the given <see cref="blockType"/>.
    /// </summary>
    [Serializable]
    public sealed class SpecialScreenBlockDto
    {
        /// <summary>
        /// Supported values (case-insensitive): <c>cloze_text</c>, <c>ClozeText</c>, <c>error_spotting</c>, <c>ErrorSpotting</c>, <c>stub</c>.
        /// </summary>
        public string blockType;

        public ClozeTextContentDto clozeText;
        public ErrorSpottingContentDto errorSpotting;
        public SpecialScreenStubBlockDto stub;
    }

    /// <summary>Placeholder block for authoring shells not yet wired to a mechanic.</summary>
    [Serializable]
    public sealed class SpecialScreenStubBlockDto
    {
        public string headline;
        public string body;
    }
}
