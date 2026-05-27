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
        public string sceneBackgroundAsset;
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
        public string sceneBackgroundAsset;
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
        public string assetId;
        public string imageUrl;
    }

    [Serializable]
    public sealed class StemBlockDto
    {
        public string kind;
        public string text;
        public string assetId;
        public string imageUrl;
        public string audioAssetId;
        public string audioUrl;
    }

    [Serializable]
    public sealed class DragDropContentDto
    {
        public string sceneBackgroundAsset;
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
        public string assetId;
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
        public string sceneBackgroundAsset;
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
        public string sceneBackgroundAsset;
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
    /// Cutscene step payload: <c>beats[]</c> narrative contract for <c>step_kind = cutscene</c>.
    /// </summary>
    [Serializable]
    public sealed class CutsceneContentDto
    {
        public string sceneBackgroundAsset;
        public CutsceneBeatDto[] beats;
        public CutsceneNpcCastEntryDto[] npcCast;
        public CutsceneNavigationDto navigation;
    }

    [Serializable]
    public sealed class CutsceneBeatDto
    {
        public string presentationMode;
        public string body;
        public string title;
        public string subtitle;
        public string speakerId;
        public int autoAdvanceMs;
        public string primaryCtaLabel;
    }

    [Serializable]
    public sealed class CutsceneNpcCastEntryDto
    {
        public string id;
        public string displayName;
        public string portraitId;
        public string side;
    }

    [Serializable]
    public sealed class CutsceneNavigationDto
    {
        public bool blockBack;
        public string primaryCtaLabel;
    }

    /// <summary>
    /// Special-screen task (<c>SpecialScreen*</c> server <c>task_type</c>): chrome + ordered embedded mechanics.
    /// Parsed with <see cref="UnityEngine.JsonUtility"/> from server <c>contentJson</c>.
    /// </summary>
    [Serializable]
    public sealed class SpecialScreenContentDto
    {
        public string sceneBackgroundAsset;
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

        /// <summary>
        /// Foto-/Bildgalerie chrome: grid of up to four images or an in-panel slideshow.
        /// Used with <c>taskType</c> <c>SpecialScreenPhotoViewer</c> or <c>screenVariant</c> <c>photo</c>.
        /// </summary>
        public SpecialScreenPhotoViewerChromeDto photoViewerChrome;

        /// <summary>
        /// E-mail / letter editor chrome: header rows, static greeting and closing, in-frame send control.
        /// Used with <c>taskType</c> <c>SpecialScreenMailEditor</c> or <c>screenVariant</c> <c>mail</c>/<c>letter</c>.
        /// </summary>
        public SpecialScreenMailChromeDto mailChrome;

        /// <summary>Ordered blocks shown sequentially inside one shell step.</summary>
        public SpecialScreenBlockDto[] blocks;
    }

    /// <summary>Mail or letter stationery layout for <see cref="SpecialScreenContentDto"/> (JsonUtility field names match JSON keys).</summary>
    [Serializable]
    public sealed class SpecialScreenMailChromeDto
    {
        /// <summary><c>email</c> (default) or <c>letter</c> — letter layout omits the subject row.</summary>
        public string format;

        /// <summary>Visible label for the from row (falls back to a client default).</summary>
        public string rowLabelFrom;

        /// <summary>Visible label for the to row (falls back to a client default).</summary>
        public string rowLabelTo;

        /// <summary>Visible label for the subject row (falls back to a client default).</summary>
        public string rowLabelSubject;

        /// <summary>Displayed value in the "from" header (read-only).</summary>
        public string from;

        /// <summary>
        /// Alternative JSON key for <see cref="from"/> (some authoring stacks avoid the word <c>from</c> in payloads).
        /// </summary>
        public string fromText;

        /// <summary>Displayed value in the "to" header (read-only).</summary>
        public string to;

        /// <summary>Alternative JSON key for <see cref="to"/>.</summary>
        public string toText;

        /// <summary>Displayed value in the subject header (read-only; hidden in letter mode).</summary>
        public string subject;

        /// <summary>Alternative JSON key for <see cref="subject"/>.</summary>
        public string subjectText;

        /// <summary>Salutation line above the learner task body (optional).</summary>
        public string greeting;

        /// <summary>Alternative JSON key for <see cref="greeting"/>.</summary>
        public string greetingText;

        /// <summary>Closing / signature line below the learner task body (optional).</summary>
        public string closing;

        /// <summary>Alternative JSON key for <see cref="closing"/>.</summary>
        public string closingText;

        /// <summary>In-frame send button caption (falls back to a client default).</summary>
        public string sendButtonText;

        /// <summary>
        /// Short feedback shown after local validation succeeds (before the shell completes the step).
        /// Falls back to the client default when empty.
        /// </summary>
        public string sendSuccessText;
    }

    /// <summary>Photo gallery / slideshow layout for <see cref="SpecialScreenContentDto"/> (JsonUtility field names match JSON keys).</summary>
    [Serializable]
    public sealed class SpecialScreenPhotoViewerChromeDto
    {
        /// <summary><c>grid4</c> (default) or <c>slideshow</c> — case-insensitive.</summary>
        public string displayMode;

        /// <summary>Optional line above the gallery (instructions).</summary>
        public string prompt;

        /// <summary>When false, fixed captions are hidden (images only).</summary>
        public bool showCaptions;

        /// <summary>Images and optional captions / learner caption fields.</summary>
        public SpecialScreenPhotoItemDto[] items;
    }

    /// <summary>One image in <see cref="SpecialScreenPhotoViewerChromeDto.items"/>.</summary>
    [Serializable]
    public sealed class SpecialScreenPhotoItemDto
    {
        public string id;

        public string assetId;

        /// <summary>Absolute http(s) URL — legacy fallback.</summary>
        public string imageUrl;

        /// <summary>Fixed caption shown under the image when <see cref="SpecialScreenPhotoViewerChromeDto.showCaptions"/> is true.</summary>
        public string caption;

        /// <summary>When true, the learner must type a caption; validated against <see cref="acceptedCaptions"/>.</summary>
        public bool requireLearnerCaption;

        /// <summary>Whitespace-trimmed, case-insensitive match when <see cref="requireLearnerCaption"/> is true.</summary>
        public string[] acceptedCaptions;

        /// <summary>When false (default), caption matching ignores case.</summary>
        public bool caseSensitive;
    }

    /// <summary>Reader/magazine layout chrome for <see cref="SpecialScreenContentDto"/> (JsonUtility field names match JSON keys).</summary>
    [Serializable]
    public sealed class SpecialScreenReaderChromeDto
    {
        public string assetId;

        /// <summary>Optional hero image (absolute http/https legacy fallback).</summary>
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
        /// Without line numbers, a single long paragraph with no spaces splits at a character midpoint for two columns.
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

    [Serializable]
    public sealed class MatchingContentDto
    {
        public string sceneBackgroundAsset;
        public string prompt;
        public string subtitle;
        public MatchingItemDto[] leftItems;
        public MatchingItemDto[] rightItems;
        public MatchingPairDto[] correctPairs;
        public MatchingPresentationDto presentation;
    }

    [Serializable]
    public sealed class MatchingItemDto
    {
        public string id;
        public string label;
        public string assetId;
        public string imageUrl;
    }

    [Serializable]
    public sealed class MatchingPairDto
    {
        public string leftItemId;
        public string rightItemId;
    }

    [Serializable]
    public sealed class MatchingPresentationDto
    {
        public string leftLabel;
        public string rightLabel;
        public bool shuffleRightOrder;
    }
}
