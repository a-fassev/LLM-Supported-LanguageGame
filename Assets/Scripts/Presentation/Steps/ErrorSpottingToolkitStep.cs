using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Error-spotting / Fehlersuche: any segment can be marked; selected spans use an inline correction field; validation on Check.</summary>
    public sealed class ErrorSpottingToolkitStep : IStepView, ISubmitFromShell
    {
        private static readonly Regex WhitespaceCollapse = new(@"\s+");

        private const int CorrectionMaxLength = 128;

        private readonly VisualElement _root;
        private readonly VisualElement _chipsRow;

        private StepContext _context;
        private Action<StepCompletionRequest> _onRequest;

        private ErrorSpottingContentDto _dto;
        private Button _resetButton;

        /// <summary>Per-segment wrapper in reading order; holds either a chip <see cref="Button"/> or inline <see cref="TextField"/>.</summary>
        private readonly Dictionary<string, VisualElement> _slotById = new(StringComparer.Ordinal);

        private readonly HashSet<string> _selectedSegmentIds = new(StringComparer.Ordinal);
        private readonly Dictionary<string, TextField> _correctionFields = new(StringComparer.Ordinal);
        private readonly Dictionary<string, string> _correctionDrafts = new(StringComparer.Ordinal);
        private readonly HashSet<string> _trueErrorIds = new(StringComparer.Ordinal);

        private bool _contentReady;
        private bool _interactable = true;

        public ErrorSpottingToolkitStep(VisualElement host)
        {
            _root = new VisualElement();
            _root.style.flexGrow = 1;
            _root.AddToClassList("lg-muted-panel");
            _root.style.paddingTop = 16;
            _root.style.paddingBottom = 16;
            _root.style.paddingLeft = 16;
            _root.style.paddingRight = 16;

            _chipsRow = new VisualElement();
            _chipsRow.AddToClassList("lg-error-spotting-row");
            _chipsRow.style.flexGrow = 0;

            host.Add(_root);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context;
            _onRequest = onRequest;
            ResetState();
            _root.Clear();

            if (!TryDeserialize(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[ErrorSpottingToolkitStep] Invalid contentJson: {error ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(error) ? "Invalid error-spotting content." : error);
                return;
            }

            _dto = dto;

            if (!string.IsNullOrWhiteSpace(dto.prompt))
            {
                var prompt = new Label(dto.prompt.Trim());
                prompt.AddToClassList("lg-heading-screen");
                prompt.style.marginBottom = 8;
                prompt.style.whiteSpace = WhiteSpace.Normal;
                _root.Add(prompt);
            }

            var errCount = CountTrueErrors(dto);

            string captionLine;
            if (!string.IsNullOrWhiteSpace(dto.counterCaption))
            {
                var range = dto.expectedErrorRange;
                captionLine = dto.counterCaption.Trim()
                    .Replace("{count}", errCount.ToString())
                    .Replace("{min}", range.min.ToString())
                    .Replace("{max}", range.max.ToString());
            }
            else
            {
                captionLine = errCount == 1
                    ? "Nel testo c'è 1 errore. Trovalo e correggilo."
                    : $"Nel testo ci sono {errCount} errori. Trovali tutti e correggili.";
            }

            var caption = new Label(captionLine);
            caption.AddToClassList("lg-text-caption");
            caption.style.whiteSpace = WhiteSpace.Normal;
            caption.style.marginBottom = 8;
            _root.Add(caption);

            if (!string.IsNullOrWhiteSpace(dto.instruction))
            {
                var ins = new Label(dto.instruction.Trim());
                ins.AddToClassList("lg-text-body");
                ins.AddToClassList("lg-text-muted");
                ins.style.marginBottom = 8;
                ins.style.whiteSpace = WhiteSpace.Normal;
                _root.Add(ins);
            }

            _resetButton = new Button { text = "Ripristina" };
            _resetButton.AddToClassList("lg-btn");
            _resetButton.AddToClassList("lg-btn--secondary");
            _resetButton.style.alignSelf = Align.FlexStart;
            _resetButton.style.marginBottom = 12;
            _resetButton.clicked += OnResetClicked;
            _root.Add(_resetButton);

            foreach (var seg in dto.segments)
            {
                var id = seg.id.Trim();
                if (seg.isError)
                    _trueErrorIds.Add(id);

                BuildSlotContent(id, seg);
            }

            _root.Add(_chipsRow);

            if (_slotById.Count == 0)
            {
                context?.presentValidationMessage?.Invoke("Questo compito non ha segmenti nel testo.");
                return;
            }

            _contentReady = true;
        }

        public void SetInteractable(bool interactable)
        {
            _interactable = interactable;
            _resetButton?.SetEnabled(interactable && _contentReady);

            foreach (var kv in _slotById)
            {
                SetSlotChildrenEnabled(kv.Value, interactable && _contentReady);
            }
        }

        public void SubmitFromShell()
        {
            if (!_contentReady || _dto == null)
            {
                _context?.presentValidationMessage?.Invoke("Il compito non è pronto. Controlla i contenuti.");
                return;
            }

            if (!_interactable)
            {
                _context?.presentValidationMessage?.Invoke("Attendi un attimo…");
                return;
            }

            SyncDraftsFromFields();

            foreach (var sid in _selectedSegmentIds)
            {
                if (!_trueErrorIds.Contains(sid))
                {
                    _context?.presentValidationMessage?.Invoke(
                        "Hai marcato anche una parte che non è uno sbaglio. Rimuovi la selezione.");
                    return;
                }
            }

            foreach (var eid in _trueErrorIds)
            {
                if (!_selectedSegmentIds.Contains(eid))
                {
                    _context?.presentValidationMessage?.Invoke("Devi selezionare tutti gli errori nel testo.");
                    return;
                }
            }

            foreach (var eid in _trueErrorIds)
            {
                if (!_correctionDrafts.TryGetValue(eid, out var raw))
                    raw = string.Empty;

                var typed = NormalizeAnswer(raw);
                if (typed.Length == 0)
                {
                    _context?.presentValidationMessage?.Invoke("Scrivi la correzione per ogni errore.");
                    return;
                }

                var segDto = FindSegment(eid);
                if (segDto == null ||
                    !MatchesAnyCorrection(typed, segDto.acceptedCorrections))
                {
                    _context?.presentValidationMessage?.Invoke("Non ancora corretto — controlla le tue parole.");
                    return;
                }
            }

            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        public void Teardown()
        {
            ResetState();
            _context = null;
            _onRequest = null;
            _dto = null;
            _root.RemoveFromHierarchy();
        }

        private void ResetState()
        {
            _contentReady = false;
            _resetButton = null;
            _slotById.Clear();
            _selectedSegmentIds.Clear();
            _correctionFields.Clear();
            _correctionDrafts.Clear();
            _trueErrorIds.Clear();
            _chipsRow.Clear();
        }

        private void OnResetClicked()
        {
            if (!_interactable || !_contentReady || _dto == null)
                return;

            _selectedSegmentIds.Clear();
            _correctionDrafts.Clear();
            RefreshAllSlots();
        }

        private void OnChipClicked(string id)
        {
            if (!_interactable)
            {
                if (_contentReady)
                    _context?.presentValidationMessage?.Invoke("Attendi un attimo…");
                return;
            }

            if (!_contentReady)
                return;

            var seg = FindSegment(id);
            if (seg == null)
                return;

            if (_selectedSegmentIds.Contains(id))
                _selectedSegmentIds.Remove(id);
            else
                _selectedSegmentIds.Add(id);

            BuildSlotContent(id, seg);
        }

        private void BuildSlotContent(string id, ErrorSpottingSegmentDto seg)
        {
            if (!_slotById.TryGetValue(id, out var slot))
            {
                slot = new VisualElement();
                slot.AddToClassList("lg-error-spotting-slot");
                _slotById[id] = slot;
                _chipsRow.Add(slot);
            }

            slot.Clear();
            _correctionFields.Remove(id);

            slot.RemoveFromClassList("lg-error-spotting-slot--marked");
            if (_selectedSegmentIds.Contains(id))
                slot.AddToClassList("lg-error-spotting-slot--marked");

            var chipText = seg.text ?? string.Empty;

            if (!_selectedSegmentIds.Contains(id))
            {
                var btn = new Button { text = chipText };
                btn.AddToClassList("lg-error-spotting-chip");
                btn.tooltip = seg.hint ?? string.Empty;
                btn.clicked += () => OnChipClicked(id);
                btn.SetEnabled(_interactable && _contentReady);
                slot.Add(btn);
                return;
            }

            var initial = string.Empty;
            if (_correctionDrafts.TryGetValue(id, out var draft))
                initial = draft;

            var tf = new TextField { value = initial, maxLength = CorrectionMaxLength };
            tf.AddToClassList("lg-textfield");
            tf.AddToClassList("lg-error-spotting-inline-field");
            tf.tooltip = seg.hint ?? string.Empty;
            tf.SetEnabled(_interactable && _contentReady);
            tf.RegisterValueChangedCallback(ev =>
            {
                _correctionDrafts[id] = ev.newValue ?? string.Empty;
            });
            slot.Add(tf);
            _correctionFields[id] = tf;
        }

        private void RefreshAllSlots()
        {
            if (_dto?.segments == null)
                return;

            foreach (var seg in _dto.segments)
                BuildSlotContent(seg.id.Trim(), seg);
        }

        private static void SetSlotChildrenEnabled(VisualElement slot, bool enabled)
        {
            if (slot == null)
                return;
            for (var i = 0; i < slot.childCount; i++)
            {
                var c = slot.ElementAt(i);
                switch (c)
                {
                    case Button b:
                        b.SetEnabled(enabled);
                        break;
                    case TextField tf:
                        tf.SetEnabled(enabled);
                        break;
                }
            }
        }

        private void SyncDraftsFromFields()
        {
            foreach (var kv in _correctionFields)
            {
                if (kv.Value != null)
                    _correctionDrafts[kv.Key] = kv.Value.value ?? string.Empty;
            }
        }

        private ErrorSpottingSegmentDto FindSegment(string id)
        {
            if (_dto?.segments == null || string.IsNullOrEmpty(id))
                return null;

            foreach (var seg in _dto.segments)
            {
                if (seg?.id != null &&
                    string.Equals(seg.id.Trim(), id.Trim(), StringComparison.Ordinal))
                    return seg;
            }

            return null;
        }

        private static int CountTrueErrors(ErrorSpottingContentDto dto)
        {
            var n = 0;
            if (dto?.segments == null)
                return 0;

            foreach (var s in dto.segments)
            {
                if (s != null && s.isError)
                    n++;
            }

            return n;
        }

        private static bool TryDeserialize(string json, out ErrorSpottingContentDto dto, out string error)
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
                error = "Error-spotting content must be a JSON object.";
                return false;
            }

            dto = JsonUtility.FromJson<ErrorSpottingContentDto>(json);
            if (dto?.segments == null || dto.segments.Length == 0)
            {
                error = "Error-spotting content needs segments.";
                return false;
            }

            if (dto.expectedErrorRange == null)
            {
                error = "Error-spotting content needs expectedErrorRange.";
                return false;
            }

            var min = dto.expectedErrorRange.min;
            var max = dto.expectedErrorRange.max;

            if (min < 1 || max < min)
            {
                error = "expectedErrorRange.min and max must be valid (min ≥ 1, max ≥ min).";
                return false;
            }

            var trueErrors = CountTrueErrors(dto);
            if (trueErrors < min || trueErrors > max)
            {
                error =
                    $"Authoring mismatch: counted {trueErrors} error segments, but expectedErrorRange asks for {min}–{max}.";
                return false;
            }

            var seenIds = new HashSet<string>(StringComparer.Ordinal);
            foreach (var seg in dto.segments)
            {
                if (seg == null)
                {
                    error = "Each segment entry must be an object.";
                    return false;
                }

                if (string.IsNullOrWhiteSpace(seg.id))
                {
                    error = "Each segment needs a non-empty id.";
                    return false;
                }

                var idKey = seg.id.Trim();
                if (!seenIds.Add(idKey))
                {
                    error = $"Duplicate segment id '{idKey}'.";
                    return false;
                }

                if (seg.isError)
                {
                    if (!HasValidCorrections(seg.acceptedCorrections))
                    {
                        error = $"Segment '{idKey}' is flagged as error but acceptedCorrections is empty.";
                        return false;
                    }
                }
            }

            return true;
        }

        private static bool HasValidCorrections(string[] accepted)
        {
            if (accepted == null || accepted.Length == 0)
                return false;
            foreach (var c in accepted)
            {
                if (!string.IsNullOrWhiteSpace(c))
                    return true;
            }

            return false;
        }

        /// <summary>Trim and collapse whitespace for forgiving comparison.</summary>
        private static string NormalizeAnswer(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return string.Empty;
            value = WhitespaceCollapse.Replace(value.Trim(), " ");
            return value;
        }

        private static bool MatchesAnyCorrection(string typedNormalized, string[] accepted)
        {
            if (accepted == null)
                return false;

            foreach (var a in accepted)
            {
                if (string.IsNullOrWhiteSpace(a))
                    continue;
                var n = NormalizeAnswer(a);
                if (n.Length == 0)
                    continue;

                if (string.Equals(
                        typedNormalized,
                        n,
                        StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }
    }
}
