using System;
using System.Collections.Generic;
using LanguageGame.Presentation;
using UnityEngine;
using UnityEngine.UI;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Renders cloze (gap-fill) tasks from <see cref="StepContext.contentJson"/>.
    /// Root: <c>caseSensitive</c> — when <c>false</c> (default if the field is omitted in Unity deserialization), matching is case-insensitive; when <c>true</c>, answers must match casing unless a gap overrides.
    /// Per gap: <see cref="ClozeSegmentDto.ignoreCase"/> as the strings <c>"true"</c>/<c>"false"</c> — <c>"true"</c> = case-insensitive, <c>"false"</c> = case-sensitive; empty or whitespace inherits the root rule.
    /// </summary>
    public sealed class ClozeTextStepView : TaskStepBase
    {
        [SerializeField] private RectTransform linesHost;

        [Tooltip("Optional authoring: inactive row with HorizontalLayoutGroup + LayoutElement (sizes from prefab).")]
        [SerializeField] private GameObject lineRowTemplate;

        [Tooltip("Optional authoring: inactive Text + ContentSizeFitter used for literal segments.")]
        [SerializeField] private GameObject literalSegmentTemplate;

        [Tooltip("Optional authoring: inactive InputField root (Image + LayoutElement + child Text + Placeholder).")]
        [SerializeField] private GameObject gapInputTemplate;

        protected override void ApplyChromeFromDesignTokens()
        {
            // Prefab layout for line templates; base handles title/body typography only.
            base.ApplyChromeFromDesignTokens();
        }

        private readonly List<GapSlot> _gapSlots = new();
        private bool _contentReady;

        protected override void ApplyTaskContent(StepContext context)
        {
            _gapSlots.Clear();
            _contentReady = false;
            TearDownClozeUi();

            if (!TryDeserialize(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[ClozeTextStepView] Invalid contentJson: {error ?? "unknown"}");
                PresentValidationFeedback(string.IsNullOrEmpty(error) ? "Invalid cloze content." : error);
                return;
            }

            if (titleText != null && !string.IsNullOrWhiteSpace(dto.prompt))
                titleText.text = dto.prompt.Trim();

            if (bodyText != null)
            {
                bodyText.text = string.Empty;
                bodyText.gameObject.SetActive(false);
            }

            EnsureLinesHost();
            var hasAnyTemplate = lineRowTemplate != null || literalSegmentTemplate != null || gapInputTemplate != null;
            if (hasAnyTemplate && !HasAuthoringLineTemplates())
                Debug.LogWarning(
                    "[ClozeTextStepView] Assign all three templates (line row, literal segment, gap input) or leave all empty. Using legacy builders for this step.");

            var useAuthoringTemplates = HasAuthoringLineTemplates();
            if (useAuthoringTemplates && linesHost == null)
            {
                Debug.LogError("[ClozeTextStepView] `linesHost` must be assigned when line templates are configured.");
                return;
            }

            var rootInsensitive = !dto.caseSensitive;
            UiThemeProvider.TryGet(out var tokens);

            // TryDeserialize guarantees each line is non-null with non-empty segments.
            foreach (var line in dto.lines)
            {
                var row = AcquireLineRow(tokens, useAuthoringTemplates);
                foreach (var seg in line.segments)
                {
                    if (seg == null || string.IsNullOrEmpty(seg.kind))
                        continue;

                    var k = seg.kind.Trim();
                    if (string.Equals(k, "text", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrEmpty(seg.text))
                            AddLiteralSegment(row, seg.text, tokens, useAuthoringTemplates);
                        continue;
                    }

                    if (!string.Equals(k, "gap", StringComparison.OrdinalIgnoreCase))
                        continue;

                    var gapInsensitive = ResolveGapCaseInsensitive(rootInsensitive, seg.ignoreCase);
                    var field = CreateGapField(row, seg, tokens, useAuthoringTemplates);
                    if (field == null)
                        continue;
                    _gapSlots.Add(new GapSlot
                    {
                        Field = field,
                        Answers = seg.correctAnswers ?? Array.Empty<string>(),
                        CaseInsensitive = gapInsensitive,
                    });
                }

                if (row.childCount == 0)
                    Destroy(row.gameObject);
            }

            if (_gapSlots.Count == 0)
            {
                Debug.LogWarning("[ClozeTextStepView] Parsed payload but found no gap slots.");
                PresentValidationFeedback("Cloze task has no gaps.");
                return;
            }

            _contentReady = true;
            LayoutRebuilder.ForceRebuildLayoutImmediate(linesHost);
        }

        public override void SetInteractable(bool interactable)
        {
            base.SetInteractable(interactable);
            foreach (var slot in _gapSlots)
            {
                if (slot.Field != null)
                    slot.Field.interactable = interactable;
            }
        }

        protected override bool ValidateBeforeComplete()
        {
            if (!_contentReady)
            {
                PresentValidationFeedback("This task is not ready yet. Check the lesson content.");
                return false;
            }

            foreach (var slot in _gapSlots)
            {
                if (slot.Field == null)
                    continue;

                var typed = (slot.Field.text ?? string.Empty).Trim();
                if (typed.Length == 0)
                {
                    PresentValidationFeedback("Fill in every gap.");
                    return false;
                }

                if (!MatchesAnyAnswer(typed, slot.Answers, slot.CaseInsensitive))
                {
                    PresentValidationFeedback("Not quite — check your answers.");
                    return false;
                }
            }

            return true;
        }

        private void TearDownClozeUi()
        {
            if (linesHost == null)
                return;
            for (var i = linesHost.childCount - 1; i >= 0; i--)
                Destroy(linesHost.GetChild(i).gameObject);
        }

        private static bool TryDeserialize(string json, out ClozeTextContentDto dto, out string error)
        {
            dto = null;
            error = null;
            if (string.IsNullOrWhiteSpace(json))
            {
                error = "Missing content.";
                return false;
            }

            var trimmedStart = json.TrimStart();
            if (!trimmedStart.StartsWith("{", StringComparison.Ordinal))
            {
                error = "Cloze content must be a JSON object.";
                return false;
            }

            // JsonUtility does not surface JSON syntax errors; follow with structural checks below.
            dto = JsonUtility.FromJson<ClozeTextContentDto>(json);

            if (dto?.lines == null || dto.lines.Length == 0)
            {
                error = "Cloze content needs at least one line.";
                return false;
            }

            var gapCount = 0;
            foreach (var line in dto.lines)
            {
                if (line?.segments == null || line.segments.Length == 0)
                {
                    error = "Each line needs at least one segment.";
                    return false;
                }

                foreach (var seg in line.segments)
                {
                    if (seg == null || string.IsNullOrEmpty(seg.kind))
                        continue;
                    if (!string.Equals(seg.kind.Trim(), "gap", StringComparison.OrdinalIgnoreCase))
                        continue;
                    if (!HasValidGapAnswers(seg.correctAnswers))
                    {
                        error = "Each gap needs at least one correct answer.";
                        return false;
                    }

                    gapCount++;
                }
            }

            if (gapCount == 0)
            {
                error = "Cloze content needs at least one gap segment.";
                return false;
            }

            return true;
        }

        private static bool HasValidGapAnswers(string[] answers)
        {
            if (answers == null || answers.Length == 0)
                return false;
            foreach (var a in answers)
            {
                if (!string.IsNullOrWhiteSpace(a))
                    return true;
            }

            return false;
        }

        /// <summary>
        /// Per-gap case rule: <paramref name="ignoreCaseField"/> <c>true</c>/<c>false</c> (JSON string); empty uses <paramref name="rootInsensitive"/>.
        /// </summary>
        private static bool ResolveGapCaseInsensitive(bool rootInsensitive, string ignoreCaseField)
        {
            if (string.IsNullOrWhiteSpace(ignoreCaseField))
                return rootInsensitive;
            if (bool.TryParse(ignoreCaseField.Trim(), out var ignoreCase))
                return ignoreCase;
            return rootInsensitive;
        }

        private static bool MatchesAnyAnswer(string typed, string[] answers, bool caseInsensitive)
        {
            var comparison = caseInsensitive ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
            foreach (var a in answers)
            {
                if (string.IsNullOrWhiteSpace(a))
                    continue;
                if (string.Equals(typed.Trim(), a.Trim(), comparison))
                    return true;
            }

            return false;
        }

        private void EnsureLinesHost()
        {
            if (linesHost != null)
            {
                if (linesHost.GetComponent<VerticalLayoutGroup>() == null)
                {
                    var v = linesHost.gameObject.AddComponent<VerticalLayoutGroup>();
                    ConfigureLinesVerticalLayout(v);
                }

                return;
            }

            var root = GetComponent<RectTransform>();
            var go = new GameObject("ClozeLinesHost", typeof(RectTransform));
            go.transform.SetParent(root, false);
            linesHost = go.GetComponent<RectTransform>();
            linesHost.anchorMin = new Vector2(0.08f, 0.28f);
            linesHost.anchorMax = new Vector2(0.92f, 0.75f);
            linesHost.offsetMin = Vector2.zero;
            linesHost.offsetMax = Vector2.zero;

            var vl = go.AddComponent<VerticalLayoutGroup>();
            ConfigureLinesVerticalLayout(vl);
        }

        private static void ConfigureLinesVerticalLayout(VerticalLayoutGroup v)
        {
            if (UiThemeProvider.TryGet(out var t))
            {
                v.spacing = t.spacing.m;
                var pad = Mathf.RoundToInt(t.spacing.s);
                v.padding = new RectOffset(pad, pad, pad, pad);
            }
            else
            {
                v.spacing = 10f;
                v.padding = new RectOffset(4, 4, 4, 4);
            }

            v.childAlignment = TextAnchor.UpperCenter;
            v.childControlHeight = false;
            v.childControlWidth = true;
            v.childForceExpandWidth = true;
            v.childForceExpandHeight = false;
        }

        private bool HasAuthoringLineTemplates() =>
            lineRowTemplate != null && literalSegmentTemplate != null && gapInputTemplate != null;

        private RectTransform AcquireLineRow(UiDesignTokens tokens, bool useAuthoringTemplates)
        {
            if (useAuthoringTemplates)
            {
                var go = Instantiate(lineRowTemplate, linesHost, false);
                go.name = "ClozeLine";
                go.SetActive(true);
                var rowRt = go.GetComponent<RectTransform>();
                return rowRt;
            }

            return CreateLineRow(linesHost, tokens);
        }

        private void AddLiteralSegment(RectTransform row, string literal, UiDesignTokens tokens, bool useAuthoringTemplates)
        {
            if (useAuthoringTemplates)
            {
                var go = Instantiate(literalSegmentTemplate, row, false);
                go.name = "ClozeLiteralSegment";
                go.SetActive(true);
                var text = go.GetComponent<Text>() ?? go.GetComponentInChildren<Text>(true);
                if (text != null)
                    ApplyLiteralSegmentText(text, literal, row, tokens, applyTokenTypography: false);
                return;
            }

            CreateSegmentText(row, literal, tokens);
        }

        private InputField CreateGapField(RectTransform row, ClozeSegmentDto seg, UiDesignTokens tokens, bool useAuthoringTemplates)
        {
            if (useAuthoringTemplates)
            {
                var go = Instantiate(gapInputTemplate, row, false);
                go.name = "ClozeGap";
                go.SetActive(true);
                var inp = go.GetComponent<InputField>() ?? go.GetComponentInChildren<InputField>(true);
                var rootRt = go.GetComponent<RectTransform>();
                if (inp == null || rootRt == null)
                {
                    Debug.LogError("[ClozeTextStepView] gapInputTemplate must include a RectTransform root and an InputField.");
                    Destroy(go);
                    return null;
                }

                ApplyGapFieldState(inp, rootRt, row, seg, tokens);
                return inp;
            }

            return CreateGapInput(row, seg, tokens);
        }

        private static RectTransform CreateLineRow(RectTransform parent, UiDesignTokens tokens)
        {
            var rowGo = new GameObject("ClozeLine", typeof(RectTransform));
            rowGo.transform.SetParent(parent, false);
            var rowRt = rowGo.GetComponent<RectTransform>();
            var h = rowGo.AddComponent<HorizontalLayoutGroup>();
            if (UiThemeProvider.TryGet(out var tk))
                h.spacing = tk.spacing.s;
            else
                h.spacing = 6f;
            h.padding = new RectOffset(2, 2, 2, 2);
            h.childAlignment = TextAnchor.MiddleLeft;
            h.childControlWidth = true;
            h.childControlHeight = true;
            h.childForceExpandWidth = false;
            h.childForceExpandHeight = false;

            var le = rowGo.AddComponent<LayoutElement>();
            le.minHeight = Mathf.Max(36f, (tokens?.typography.body.fontSize ?? 26) * 1.6f);
            return rowRt;
        }

        private static void ApplyLiteralSegmentText(Text text, string literal, RectTransform row, UiDesignTokens tokens,
            bool applyTokenTypography = true)
        {
            if (text == null)
                return;

            text.text = literal;
            if (!applyTokenTypography)
                return;

            var fontSize = tokens?.typography.body.fontSize ?? 24;
            var panelColor = UiTokenApplier.GetPanelBackgroundNear(row, new Color(0.95f, 0.95f, 0.97f, 1f));
            var color = UiTokenApplier.ResolveReadableOnBackground(tokens?.palette.textPrimary ?? new Color(0.12f, 0.14f, 0.2f, 1f), panelColor);
            if (tokens != null)
                UiTokenApplier.ApplyText(text, tokens.typography.body, color);
            else
            {
                text.font = UiTokenApplier.ResolveFallbackFont();
                text.fontSize = fontSize;
                text.color = color;
            }

            text.alignment = TextAnchor.MiddleLeft;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Overflow;
        }

        private static void CreateSegmentText(RectTransform row, string literal, UiDesignTokens tokens)
        {
            var go = new GameObject("ClozeLiteralSegment", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            go.transform.SetParent(row, false);
            var text = go.GetComponent<Text>();
            ApplyLiteralSegmentText(text, literal, row, tokens);

            var fitter = go.AddComponent<ContentSizeFitter>();
            fitter.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
            fitter.verticalFit = ContentSizeFitter.FitMode.Unconstrained;
        }

        private static void EnsureGapInputTextRenderable(InputField inp)
        {
            var t = inp != null ? inp.textComponent : null;
            if (t == null)
                return;
            // InputField.UpdateLabel skips entirely when font is null (broken legacy font refs in prefabs / Unity 6).
            if (t.font == null)
                t.font = UiTokenApplier.ResolveFallbackFont();
            t.horizontalOverflow = HorizontalWrapMode.Overflow;
            t.verticalOverflow = VerticalWrapMode.Truncate;
        }

        private static void ApplyGapFieldState(InputField inp, RectTransform root, RectTransform row, ClozeSegmentDto seg, UiDesignTokens tokens,
            bool applyTokenMetrics = true)
        {
            var chars = ComputePreferredCharWidth(seg);
            var maxLen = seg.maxLength > 0 ? seg.maxLength : Mathf.Min(96, chars + 6);

            inp.text = string.Empty;
            inp.lineType = InputField.LineType.SingleLine;
            inp.characterLimit = maxLen;
            inp.contentType = InputField.ContentType.Standard;

            if (inp.placeholder is Text pt)
                pt.text = string.IsNullOrEmpty(seg.placeholder) ? "…" : seg.placeholder;

            EnsureGapInputTextRenderable(inp);

            if (!applyTokenMetrics)
                return;

            var font = tokens != null
                ? UiTokenApplier.ResolveFont(tokens.typography.body)
                : UiTokenApplier.ResolveFallbackFont();
            var fontSize = tokens?.typography.body.fontSize ?? 24;
            var panelColor = UiTokenApplier.GetPanelBackgroundNear(row, new Color(0.95f, 0.95f, 0.97f, 1f));
            var defaultTextColor = tokens?.palette.textPrimary ?? new Color(0.12f, 0.14f, 0.2f, 1f);
            var inputTextColor = UiTokenApplier.ResolveReadableOnBackground(defaultTextColor, panelColor);
            var inputBackgroundColor = UiTokenApplier.ResolveInputFieldBackgroundOnPanel(tokens?.palette.inputBackground ?? new Color(1f, 1f, 1f, 0.12f), panelColor);
            var fallbackPlaceholderColor = Color.Lerp(inputTextColor, panelColor, 0.35f);
            fallbackPlaceholderColor.a = 0.8f;
            var tokenPlaceholder = tokens?.palette.inputPlaceholder ?? fallbackPlaceholderColor;
            var placeholderColor = UiTokenApplier.ResolveReadableOnBackground(tokenPlaceholder, panelColor);
            placeholderColor.a = Mathf.Clamp01(Mathf.Max(placeholderColor.a, 0.75f));

            if (inp.targetGraphic is Image bgImage)
                bgImage.color = inputBackgroundColor;

            var estW = Mathf.Clamp(Mathf.CeilToInt(fontSize * 0.55f * chars), 48, 560);
            var layout = root.GetComponent<LayoutElement>();
            if (layout == null)
                layout = root.gameObject.AddComponent<LayoutElement>();
            layout.minWidth = estW;
            layout.preferredWidth = estW;
            layout.minHeight = Mathf.CeilToInt(fontSize * 1.45f);

            var inputText = inp.textComponent;
            if (inputText != null)
            {
                inputText.font = font;
                inputText.fontSize = fontSize;
                inputText.color = inputTextColor;
                inputText.supportRichText = false;
                inputText.raycastTarget = true;
                inputText.alignment = TextAnchor.MiddleLeft;
                // Wrap + narrow layout can yield no visible glyphs/caret for single-line fields; Overflow matches stock InputField behavior.
                inputText.horizontalOverflow = HorizontalWrapMode.Overflow;
                inputText.verticalOverflow = VerticalWrapMode.Truncate;
            }

            if (inp.placeholder is Text ph)
            {
                ph.font = font;
                ph.fontSize = fontSize;
                ph.fontStyle = FontStyle.Italic;
                ph.color = placeholderColor;
                ph.raycastTarget = false;
            }
        }

        private static InputField CreateGapInput(RectTransform row, ClozeSegmentDto seg, UiDesignTokens tokens)
        {
            var root = new GameObject("ClozeGap", typeof(RectTransform));
            root.transform.SetParent(row, false);
            root.AddComponent<CanvasRenderer>();

            var bg = root.AddComponent<Image>();
            bg.raycastTarget = true;

            var layout = root.AddComponent<LayoutElement>();

            var inp = root.AddComponent<InputField>();
            inp.targetGraphic = bg;

            var textGo = new GameObject("Text");
            textGo.transform.SetParent(root.transform, false);
            var tRt = textGo.AddComponent<RectTransform>();
            tRt.anchorMin = new Vector2(0.04f, 0.1f);
            tRt.anchorMax = new Vector2(0.96f, 0.9f);
            tRt.offsetMin = Vector2.zero;
            tRt.offsetMax = Vector2.zero;
            textGo.AddComponent<CanvasRenderer>();
            var inputText = textGo.AddComponent<Text>();
            inputText.supportRichText = false;
            inputText.raycastTarget = true;
            inputText.alignment = TextAnchor.MiddleLeft;
            inp.textComponent = inputText;

            var phGo = new GameObject("Placeholder");
            phGo.transform.SetParent(root.transform, false);
            var pRt = phGo.AddComponent<RectTransform>();
            UiTokenApplier.StretchFull(pRt);
            phGo.AddComponent<CanvasRenderer>();
            var pt = phGo.AddComponent<Text>();
            inp.placeholder = pt;

            ApplyGapFieldState(inp, root.GetComponent<RectTransform>(), row, seg, tokens);
            return inp;
        }

        private static int ComputePreferredCharWidth(ClozeSegmentDto seg)
        {
            var n = 4;
            if (seg.maxLength > 0)
                n = Math.Max(n, seg.maxLength);
            if (seg.correctAnswers == null)
                return n;
            foreach (var a in seg.correctAnswers)
            {
                if (string.IsNullOrEmpty(a))
                    continue;
                n = Mathf.Max(n, a.Trim().Length);
            }

            return n + 1;
        }

        private struct GapSlot
        {
            public InputField Field;
            public string[] Answers;
            public bool CaseInsensitive;
        }
    }

    /// <summary>Payload DTO for <see cref="JsonUtility"/> — must remain <c>public</c> so nested arrays deserialize reliably across players.</summary>
    [Serializable]
    public class ClozeTextContentDto
    {
        [Tooltip("false (default if omitted): case-insensitive answer matching. true: require matching letter case unless a gap sets ignoreCase.")]
        public bool caseSensitive;

        public string prompt;
        public ClozeLineDto[] lines;
    }

    /// <summary>One rendered row; guaranteed non-null with <see cref="segments"/> after successful <see cref="ClozeTextStepView"/> parse.</summary>
    [Serializable]
    public class ClozeLineDto
    {
        public ClozeSegmentDto[] segments;
    }

    [Serializable]
    public class ClozeSegmentDto
    {
        public string kind;
        public string text;
        public string[] correctAnswers;
        public string placeholder;
        public int maxLength;

        /// <summary>Optional gap override: "true" = match ignoring case; "false" = exact case; empty = use root <c>caseSensitive</c> rule.</summary>
        public string ignoreCase;
    }
}
