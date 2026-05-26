using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Error-spotting / Fehlersuche: any segment can be marked; selected spans use an inline correction field; validation on Check.</summary>
    public sealed class ErrorSpottingToolkitStep : IStepView, ISubmitFromShell, ITaskAttemptPayloadProvider
    {
        private static readonly Regex WhitespaceCollapse = new(@"\s+");

        private const int CorrectionMaxLength = 128;

        private readonly bool _uiReady;
        private readonly VisualElement _root;
        private readonly VisualElement _chipsRow;
        private readonly Label _promptLabel;
        private readonly Label _captionLabel;
        private readonly Label _instructionLabel;

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

        /// <param name="useMutedChrome">When false (e.g. embedded in <see cref="SpecialScreenToolkitStep"/>), skips outer panel styling to avoid stacked frames.</param>
        public ErrorSpottingToolkitStep(VisualElement host, bool useMutedChrome = true)
        {
            _uiReady = ToolkitStepUx.TryMount(host, ToolkitStepTemplatePaths.ErrorSpottingTask, "error-spotting-root", out _root);
            if (_uiReady)
                ToolkitStepUx.ApplyMutedTaskChrome(_root, useMutedChrome);

            _promptLabel = _uiReady
                ? ToolkitStepUx.QueryOptional<Label>(_root, "task-prompt")
                : null;
            _captionLabel = _uiReady
                ? ToolkitStepUx.QueryOptional<Label>(_root, "task-caption")
                : null;
            _instructionLabel = _uiReady
                ? ToolkitStepUx.QueryOptional<Label>(_root, "task-instruction")
                : null;
            _resetButton = _uiReady
                ? ToolkitStepUx.QueryRequired<Button>(_root, "task-reset-button", nameof(ErrorSpottingToolkitStep))
                : null;
            _chipsRow = _uiReady
                ? ToolkitStepUx.QueryRequired<VisualElement>(_root, "error-spotting-chips-row", nameof(ErrorSpottingToolkitStep))
                : null;

            if (_resetButton != null)
                _resetButton.clicked += OnResetClicked;
        }

        /// <summary>True after <see cref="Bind"/> produced segment UI.</summary>
        public bool IsBinderReady => _contentReady;

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context;
            _onRequest = onRequest;
            ResetState();

            if (!ToolkitStepUx.GuardTemplateReady(_uiReady, context, _chipsRow, _resetButton))
                return;

            ToolkitStepUx.ClearHost(_chipsRow);
            ToolkitStepUx.SetOptionalLabel(_promptLabel, null);
            ToolkitStepUx.SetOptionalLabel(_captionLabel, null);
            ToolkitStepUx.SetOptionalLabel(_instructionLabel, null);

            if (!TryParseContentDto(context?.contentJson, out var dto, out var error))
            {
                Debug.LogWarning($"[ErrorSpottingToolkitStep] Invalid contentJson: {error ?? "unknown"}");
                context?.presentValidationMessage?.Invoke(string.IsNullOrEmpty(error)
                    ? "Contenuto dell'esercizio «trova gli errori» non valido."
                    : error);
                return;
            }

            _dto = dto;

            ToolkitStepUx.SetOptionalLabel(_promptLabel, dto.prompt?.Trim());

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

            ToolkitStepUx.SetOptionalLabel(_captionLabel, captionLine, hideWhenEmpty: false);
            ToolkitStepUx.SetOptionalLabel(_instructionLabel, dto.instruction?.Trim());

            foreach (var seg in dto.segments)
            {
                var id = seg.id.Trim();
                if (seg.isError)
                    _trueErrorIds.Add(id);

                BuildSlotContent(id, seg);
            }

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
            if (!_contentReady || _dto == null)
            {
                message = "Il compito non è pronto. Controlla i contenuti.";
                return false;
            }

            if (!_interactable)
            {
                message = "Attendi un attimo…";
                return false;
            }

            SyncDraftsFromFields();

            foreach (var sid in _selectedSegmentIds)
            {
                if (!_trueErrorIds.Contains(sid))
                {
                    message =
                        "Hai marcato anche una parte che non è uno sbaglio. Rimuovi la selezione.";
                    return false;
                }
            }

            foreach (var eid in _trueErrorIds)
            {
                if (!_selectedSegmentIds.Contains(eid))
                {
                    message = "Devi selezionare tutti gli errori nel testo.";
                    return false;
                }
            }

            foreach (var eid in _trueErrorIds)
            {
                if (!_correctionDrafts.TryGetValue(eid, out var raw))
                    raw = string.Empty;

                var typed = NormalizeAnswer(raw);
                if (typed.Length == 0)
                {
                    message = "Scrivi la correzione per ogni errore.";
                    return false;
                }

                var segDto = FindSegment(eid);
                if (segDto == null ||
                    !MatchesAnyCorrection(typed, segDto.acceptedCorrections))
                {
                    message = "Non ancora corretto — controlla le tue parole.";
                    return false;
                }
            }

            return true;
        }

        public bool TryBuildTaskAttemptJson(out string attemptJson, out string validationMessage)
        {
            attemptJson = null;
            validationMessage = null;
            if (!_contentReady || _dto == null)
            {
                validationMessage = "Il compito non è pronto.";
                return false;
            }

            SyncDraftsFromFields();

            var selArr = string.Join(",", _selectedSegmentIds.OrderBy(x => x).Select(TaskAttemptJson.StringLiteral));
            var corrParts = new List<string>();
            foreach (var sid in _selectedSegmentIds.OrderBy(x => x))
            {
                _correctionDrafts.TryGetValue(sid, out var raw);
                var v = NormalizeAnswer(raw ?? string.Empty);
                corrParts.Add($"{TaskAttemptJson.StringLiteral(sid)}:{TaskAttemptJson.StringLiteral(v)}");
            }

            attemptJson =
                "{\"taskType\":\"ErrorSpotting\",\"errorSpotting\":{\"selectedSegmentIds\":[" +
                selArr +
                "],\"corrections\":{" +
                string.Join(",", corrParts) +
                "}}}";
            return true;
        }

        public void Teardown()
        {
            if (_resetButton != null)
                _resetButton.clicked -= OnResetClicked;
            ResetState();
            _context = null;
            _onRequest = null;
            _dto = null;
            _root?.RemoveFromHierarchy();
        }

        private void ResetState()
        {
            _contentReady = false;

            _slotById.Clear();
            _selectedSegmentIds.Clear();
            _correctionFields.Clear();
            _correctionDrafts.Clear();
            _trueErrorIds.Clear();
            ToolkitStepUx.ClearHost(_chipsRow);
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
                if (!ToolkitStepUx.TryInstantiatePart(
                        ToolkitStepTemplatePaths.ErrorSpottingSlotPart,
                        "error-spotting-slot-part",
                        nameof(ErrorSpottingToolkitStep),
                        _context,
                        out slot))
                    return;
                _slotById[id] = slot;
                _chipsRow.Add(slot);
            }

            ToolkitStepUx.ClearHost(slot);
            _correctionFields.Remove(id);

            slot.RemoveFromClassList("lg-error-spotting-slot--marked");
            if (_selectedSegmentIds.Contains(id))
                slot.AddToClassList("lg-error-spotting-slot--marked");

            var chipText = seg.text ?? string.Empty;

            if (!_selectedSegmentIds.Contains(id))
            {
                if (!ToolkitStepUx.TryInstantiatePart(
                        ToolkitStepTemplatePaths.ErrorSpottingChipPart,
                        "error-spotting-chip-part",
                        nameof(ErrorSpottingToolkitStep),
                        _context,
                        out var btnPart))
                    return;

                var btn = btnPart as Button;
                if (btn == null)
                    return;
                btn.text = chipText;
                btn.tooltip = seg.hint ?? string.Empty;
                btn.clicked += () => OnChipClicked(id);
                btn.SetEnabled(_interactable && _contentReady);
                slot.Add(btn);
                return;
            }

            var initial = string.Empty;
            if (_correctionDrafts.TryGetValue(id, out var draft))
                initial = draft;

            if (!ToolkitStepUx.TryInstantiatePart(
                    ToolkitStepTemplatePaths.ErrorSpottingInlineFieldPart,
                    "error-spotting-inline-field-part",
                    nameof(ErrorSpottingToolkitStep),
                    _context,
                    out var tfPart))
                return;

            var tf = tfPart as TextField;
            if (tf == null)
                return;

            tf.SetValueWithoutNotify(initial);
            tf.maxLength = CorrectionMaxLength;
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

        internal static bool TryParseContentDto(string json, out ErrorSpottingContentDto dto, out string error)
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

            dto = JsonUtility.FromJson<ErrorSpottingContentDto>(json);
            if (dto?.segments == null || dto.segments.Length == 0)
            {
                error = "Servono i segmenti di testo.";
                return false;
            }

            if (dto.expectedErrorRange == null)
            {
                error = "Serve expectedErrorRange (min/max numero errori).";
                return false;
            }

            var min = dto.expectedErrorRange.min;
            var max = dto.expectedErrorRange.max;

            if (min < 1 || max < min)
            {
                error = "expectedErrorRange non valido (min ≥ 1 e max ≥ min).";
                return false;
            }

            var trueErrors = CountTrueErrors(dto);
            if (trueErrors < min || trueErrors > max)
            {
                error =
                    $"Contenuto incoerente: ci sono {trueErrors} errori nel testo, ma il range previsto è {min}–{max}.";
                return false;
            }

            var seenIds = new HashSet<string>(StringComparer.Ordinal);
            foreach (var seg in dto.segments)
            {
                if (seg == null)
                {
                    error = "Ogni elemento dei segmenti deve essere un oggetto.";
                    return false;
                }

                if (string.IsNullOrWhiteSpace(seg.id))
                {
                    error = "Ogni segmento deve avere un id non vuoto.";
                    return false;
                }

                var idKey = seg.id.Trim();
                if (!seenIds.Add(idKey))
                {
                    error = $"Id duplicato nel segmento «{idKey}».";
                    return false;
                }

                if (seg.isError)
                {
                    if (!HasValidCorrections(seg.acceptedCorrections))
                    {
                        error =
                            $"Il segmento «{idKey}» è segnato come errore ma non ha correzioni accettate.";
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
