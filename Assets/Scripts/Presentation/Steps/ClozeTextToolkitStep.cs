using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Cloze (gap-fill) task UI in UI Toolkit.</summary>
    public sealed class ClozeTextToolkitStep : IStepView, ISubmitFromShell, ITaskAttemptPayloadProvider
    {
        private readonly VisualElement _root;

        private readonly List<(TextField field, string[] answers, bool caseInsensitive)> _gaps = new();

        private StepContext _context;

        private Action<StepCompletionRequest> _onRequest;

        private bool _contentReady;

        /// <param name="useMutedChrome">When false (e.g. embedded in <see cref="SpecialScreenToolkitStep"/>), skips outer panel styling to avoid stacked frames.</param>
        public ClozeTextToolkitStep(VisualElement host, bool useMutedChrome = true)
        {
            _root = new VisualElement();
            _root.style.flexGrow = 1;
            if (useMutedChrome)
            {
                _root.AddToClassList("lg-muted-panel");
                _root.style.paddingTop = 16;
                _root.style.paddingBottom = 16;
                _root.style.paddingLeft = 16;
                _root.style.paddingRight = 16;
            }

            host.Add(_root);
        }

        /// <summary>True after <see cref="Bind"/> produced interactive gaps.</summary>
        public bool IsBinderReady => _contentReady;

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context;
            _onRequest = onRequest;
            _gaps.Clear();
            _contentReady = false;
            _root.Clear();

            if (!TryParseContentDto(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[ClozeTextToolkitStep] Invalid contentJson: {error ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(error)
                    ? "Contenuto del testo a buchi non valido."
                    : error);
                return;
            }

            if (!string.IsNullOrWhiteSpace(dto.prompt))
            {
                var prompt = new Label(dto.prompt.Trim());
                prompt.AddToClassList("lg-heading-screen");
                prompt.style.marginBottom = 16;
                prompt.style.whiteSpace = WhiteSpace.Normal;
                _root.Add(prompt);
            }

            var linesHost = new VisualElement();
            linesHost.style.flexGrow = 1;
            _root.Add(linesHost);

            var rootInsensitive = !dto.caseSensitive;
            foreach (var line in dto.lines)
            {
                if (line?.segments == null || line.segments.Length == 0)
                    continue;

                var row = new VisualElement();
                row.style.flexDirection = FlexDirection.Row;
                row.style.flexWrap = Wrap.Wrap;
                row.style.alignItems = Align.Center;
                row.style.marginBottom = 10;

                var hasContent = false;
                foreach (var seg in line.segments)
                {
                    if (seg == null || string.IsNullOrEmpty(seg.kind))
                        continue;

                    var k = seg.kind.Trim();
                    if (string.Equals(k, "text", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!string.IsNullOrEmpty(seg.text))
                        {
                            var lit = new Label(seg.text);
                            lit.AddToClassList("lg-text-body");
                            lit.style.whiteSpace = WhiteSpace.Normal;
                            lit.style.marginRight = 6;
                            row.Add(lit);
                            hasContent = true;
                        }

                        continue;
                    }

                    if (!string.Equals(k, "gap", StringComparison.OrdinalIgnoreCase))
                        continue;

                    var gapInsensitive = ResolveGapCaseInsensitive(rootInsensitive, seg.ignoreCase);
                    var tf = new TextField { maxLength = seg.maxLength > 0 ? Mathf.Clamp(seg.maxLength, 1, 256) : -1 };
                    if (!string.IsNullOrEmpty(seg.placeholder))
                        tf.tooltip = seg.placeholder;
                    tf.AddToClassList("lg-textfield");
                    tf.style.minWidth = 100;
                    tf.style.marginRight = 6;
                    tf.style.marginBottom = 4;
                    row.Add(tf);
                    _gaps.Add((tf, seg.correctAnswers ?? Array.Empty<string>(), gapInsensitive));
                    hasContent = true;
                }

                if (hasContent)
                    linesHost.Add(row);
            }

            if (_gaps.Count == 0)
            {
                Debug.LogWarning("[ClozeTextToolkitStep] Parsed payload but found no gap slots.");
                context?.presentValidationMessage?.Invoke(
                    "Questo esercizio non ha spazi da completare.");
                return;
            }

            _contentReady = true;
        }

        public void SetInteractable(bool interactable)
        {
            foreach (var g in _gaps)
            {
                if (g.field != null)
                    g.field.SetEnabled(interactable);
            }
        }

        public void SubmitFromShell()
        {
            if (_context != null && QuestScoringPolicy.ServerScoresPizza(_context.rewardRulesJson))
            {
                if (!TryBuildTaskAttemptJson(out var json, out var aerr))
                {
                    if (!string.IsNullOrEmpty(aerr))
                        _context?.presentValidationMessage?.Invoke(aerr);
                    return;
                }

                _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true, taskAttemptJson = json });
                return;
            }

            if (!TryValidateLocally(out var message))
            {
                _context?.presentValidationMessage?.Invoke(message);
                return;
            }

            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        /// <summary>
        /// Client-side validation without completing the step (used by composite hosts such as <see cref="SpecialScreenToolkitStep"/>).
        /// </summary>
        public bool TryValidateLocally(out string message)
        {
            message = null;
            if (!_contentReady)
            {
                message = "Il compito non è ancora pronto. Controlla i contenuti.";
                return false;
            }

            foreach (var slot in _gaps)
            {
                if (slot.field == null)
                    continue;
                var typed = (slot.field.value ?? string.Empty).Trim();
                if (typed.Length == 0)
                {
                    message = "Compila tutti i buchi.";
                    return false;
                }

                if (!MatchesAnyAnswer(typed, slot.answers, slot.caseInsensitive))
                {
                    message = "Non ancora giusto — controlla le tue risposte.";
                    return false;
                }
            }

            return true;
        }

        public bool TryBuildTaskAttemptJson(out string attemptJson, out string validationMessage)
        {
            attemptJson = null;
            validationMessage = null;
            if (!_contentReady)
            {
                validationMessage = "Il compito non è ancora pronto.";
                return false;
            }

            var parts = new List<string>(_gaps.Count);
            foreach (var slot in _gaps)
            {
                var typed = slot.field != null ? (slot.field.value ?? string.Empty).Trim() : string.Empty;
                parts.Add(TaskAttemptJson.StringLiteral(typed));
            }

            attemptJson =
                "{\"taskType\":\"ClozeText\",\"clozeText\":{\"answers\":[" + string.Join(",", parts) + "]}}";
            return true;
        }

        public void Teardown()
        {
            _context = null;
            _onRequest = null;
            _gaps.Clear();
            _root?.RemoveFromHierarchy();
        }

        internal static bool TryParseContentDto(string json, out ClozeTextContentDto dto, out string error)
        {
            dto = null;
            error = null;
            if (string.IsNullOrWhiteSpace(json))
            {
                error = "Contenuto mancante.";
                return false;
            }

            if (!json.TrimStart().StartsWith("{", StringComparison.Ordinal))
            {
                error = "Il contenuto deve essere un oggetto JSON.";
                return false;
            }

            dto = JsonUtility.FromJson<ClozeTextContentDto>(json);
            if (dto?.lines == null || dto.lines.Length == 0)
            {
                error = "Serve almeno una riga di testo.";
                return false;
            }

            var gapCount = 0;
            foreach (var line in dto.lines)
            {
                if (line?.segments == null || line.segments.Length == 0)
                {
                    error = "Ogni riga deve avere almeno un segmento.";
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
                        error = "Ogni buco deve avere almeno una risposta corretta.";
                        return false;
                    }

                    gapCount++;
                }
            }

            if (gapCount == 0)
            {
                error = "Serve almeno un buco nel testo.";
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
    }
}
