using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Cloze (gap-fill) task UI in UI Toolkit.</summary>
    public sealed class ClozeTextToolkitStep : IStepView, ISubmitFromShell
    {
        private readonly VisualElement _root;

        private readonly List<(TextField field, string[] answers, bool caseInsensitive)> _gaps = new();

        private StepContext _context;

        private Action<StepCompletionRequest> _onRequest;

        private bool _contentReady;

        public ClozeTextToolkitStep(VisualElement host)
        {
            _root = new VisualElement();
            _root.style.flexGrow = 1;
            _root.AddToClassList("lg-muted-panel");
            _root.style.paddingTop = 16;
            _root.style.paddingBottom = 16;
            _root.style.paddingLeft = 16;
            _root.style.paddingRight = 16;
            host.Add(_root);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context;
            _onRequest = onRequest;
            _gaps.Clear();
            _contentReady = false;
            _root.Clear();

            if (!TryDeserialize(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[ClozeTextToolkitStep] Invalid contentJson: {error ?? "unknown"}");
                context?.presentValidationFeedback?.Invoke(string.IsNullOrEmpty(error) ? "Invalid cloze content." : error);
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
                context?.presentValidationFeedback?.Invoke("Cloze task has no gaps.");
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
            if (!_contentReady)
            {
                _context?.presentValidationFeedback?.Invoke("This task is not ready yet. Check the lesson content.");
                return;
            }

            foreach (var slot in _gaps)
            {
                if (slot.field == null)
                    continue;
                var typed = (slot.field.value ?? string.Empty).Trim();
                if (typed.Length == 0)
                {
                    _context?.presentValidationFeedback?.Invoke("Fill in every gap.");
                    return;
                }

                if (!MatchesAnyAnswer(typed, slot.answers, slot.caseInsensitive))
                {
                    _context?.presentValidationFeedback?.Invoke("Not quite — check your answers.");
                    return;
                }
            }

            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        public void Teardown()
        {
            _context = null;
            _onRequest = null;
            _gaps.Clear();
            _root?.RemoveFromHierarchy();
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

            if (!json.TrimStart().StartsWith("{", StringComparison.Ordinal))
            {
                error = "Cloze content must be a JSON object.";
                return false;
            }

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
