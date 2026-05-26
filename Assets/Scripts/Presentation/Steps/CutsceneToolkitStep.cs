using System;
using System.Collections;
using System.Collections.Generic;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Cutscene beats in UI Toolkit; local beat pager then quest shell advance RPC.</summary>
    public sealed class CutsceneToolkitStep : IStepView, ICutsceneBeatNavigator
    {
        private const string DefaultCtaLabel = "Weiter";
        private const string InvalidContentBody =
            "Inhalt fehlerhaft. Fortschritt ist blockiert, bis die Szene korrekt geladen ist.";
        private const string InvalidContentTitle = "Szene nicht verfügbar";

        private static readonly HashSet<string> ValidPresentationModes = new(StringComparer.OrdinalIgnoreCase)
        {
            "narrator",
            "npcDialog",
            "innerMonologue",
            "gameInfo",
        };

        private readonly VisualElement _root;
        private readonly VisualElement _beatHost;

        private CutsceneContentDto _dto;
        private int _beatIndex;
        private Coroutine _autoAdvanceCoroutine;
        private MonoBehaviour _coroutineHost;
        private Action<StepCompletionRequest> _onRequest;
        private Action _onBeatChanged;
        private bool _questBlockBack;
        private bool _isContentValid;

        public bool IsContentValid => _isContentValid;

        public CutsceneToolkitStep(VisualElement host)
        {
            if (!ToolkitStepUx.TryMount(host, ToolkitStepTemplatePaths.CutsceneHost, "cutscene-root", out _root))
            {
                _root = new VisualElement { name = "cutscene-root" };
                _root.AddToClassList("lg-cutscene-root");
                _root.style.flexGrow = 1;
                host.Add(_root);
            }

            _beatHost = ToolkitStepUx.Query<VisualElement>(_root, "cutscene-beat-host", nameof(CutsceneToolkitStep));
            if (_beatHost == null)
            {
                _beatHost = new VisualElement();
                _beatHost.style.flexGrow = 1;
                _root.Add(_beatHost);
            }
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _onRequest = onRequest;
            _onBeatChanged = context?.onCutsceneBeatChanged;
            _coroutineHost = context?.coroutineHost;
            _questBlockBack = ResolveQuestBlockBack(context?.questMetaJson);
            _beatIndex = 0;

            if (!TryDeserialize(context?.contentJson, out _dto, out var parseError))
            {
                _isContentValid = false;
                _dto = null;
                Debug.LogWarning($"[CutsceneToolkitStep] Invalid cutscene content: {parseError}");
                RenderInvalid();
                NotifyBeatChanged();
                return;
            }

            _isContentValid = true;
            RenderCurrentBeat();
            ScheduleAutoAdvanceForCurrentBeat();
            NotifyBeatChanged();
        }

        public bool TryAdvanceBeat()
        {
            CancelAutoAdvance();
            if (!_isContentValid || _dto?.beats == null || _dto.beats.Length == 0)
                return false;

            if (_beatIndex >= _dto.beats.Length - 1)
                return false;

            _beatIndex++;
            RenderCurrentBeat();
            ScheduleAutoAdvanceForCurrentBeat();
            NotifyBeatChanged();
            return true;
        }

        public string GetPrimaryCtaLabel()
        {
            if (_dto?.beats == null || _dto.beats.Length == 0)
                return DefaultCtaLabel;

            var beat = _dto.beats[Mathf.Clamp(_beatIndex, 0, _dto.beats.Length - 1)];
            if (!string.IsNullOrWhiteSpace(beat?.primaryCtaLabel))
                return beat.primaryCtaLabel.Trim();

            if (!string.IsNullOrWhiteSpace(_dto.navigation?.primaryCtaLabel))
                return _dto.navigation.primaryCtaLabel.Trim();

            return DefaultCtaLabel;
        }

        public bool IsCutsceneBlockBack()
        {
            if (_dto?.navigation != null && _dto.navigation.blockBack)
                return true;
            return _questBlockBack;
        }

        public void OnShellPrimaryPressed()
        {
            CancelAutoAdvance();
        }

        public void TeardownBeatNavigation()
        {
            CancelAutoAdvance();
        }

        public void SetInteractable(bool interactable)
        {
            _root?.SetEnabled(interactable);
        }

        public void Teardown()
        {
            TeardownBeatNavigation();
            _root?.RemoveFromHierarchy();
        }

        private void ScheduleAutoAdvanceForCurrentBeat()
        {
            CancelAutoAdvance();
            if (_coroutineHost == null || _dto?.beats == null || _dto.beats.Length == 0)
                return;

            var beat = _dto.beats[Mathf.Clamp(_beatIndex, 0, _dto.beats.Length - 1)];
            if (beat == null || beat.autoAdvanceMs <= 0)
                return;

            _autoAdvanceCoroutine = _coroutineHost.StartCoroutine(AutoAdvanceAfterDelay(beat.autoAdvanceMs));
        }

        private IEnumerator AutoAdvanceAfterDelay(int delayMs)
        {
            yield return new WaitForSeconds(Mathf.Max(0.1f, delayMs / 1000f));
            _autoAdvanceCoroutine = null;
            if (!_isContentValid)
                yield break;

            if (TryAdvanceBeat())
                yield break;

            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        private void NotifyBeatChanged() => _onBeatChanged?.Invoke();

        private void CancelAutoAdvance()
        {
            if (_autoAdvanceCoroutine != null && _coroutineHost != null)
                _coroutineHost.StopCoroutine(_autoAdvanceCoroutine);
            _autoAdvanceCoroutine = null;
        }

        private void RenderInvalid()
        {
            _beatHost.Clear();
            var panel = InstantiateNarratorBeat();
            if (panel == null)
                return;

            SetBeatLabel(panel, "beat-title", InvalidContentTitle);
            SetBeatLabel(panel, "beat-subtitle", string.Empty, hideWhenEmpty: true);
            SetBeatLabel(panel, "beat-body", InvalidContentBody);
            _beatHost.Add(panel);
        }

        private void RenderCurrentBeat()
        {
            _beatHost.Clear();
            if (_dto?.beats == null || _dto.beats.Length == 0)
            {
                RenderInvalid();
                return;
            }

            var beat = _dto.beats[Mathf.Clamp(_beatIndex, 0, _dto.beats.Length - 1)];
            if (beat == null || string.IsNullOrWhiteSpace(beat.body))
            {
                RenderInvalid();
                return;
            }

            var mode = (beat.presentationMode ?? "narrator").Trim();
            switch (mode.ToLowerInvariant())
            {
                case "npcdialog":
                    _beatHost.Add(BuildNpcDialog(beat));
                    break;
                case "innermonologue":
                    _beatHost.Add(BuildThoughtPanel(beat));
                    break;
                case "gameinfo":
                    _beatHost.Add(BuildGameInfoPanel(beat));
                    break;
                default:
                    _beatHost.Add(BuildNarratorPanel(beat));
                    break;
            }
        }

        private VisualElement BuildNarratorPanel(CutsceneBeatDto beat)
        {
            var panel = InstantiateNarratorBeat();
            if (panel == null)
                return new VisualElement();

            SetBeatLabel(panel, "beat-title", beat.title, hideWhenEmpty: true);
            SetBeatLabel(panel, "beat-subtitle", beat.subtitle, hideWhenEmpty: true);
            SetBeatLabel(panel, "beat-body", beat.body?.Trim() ?? string.Empty);
            return panel;
        }

        private VisualElement BuildThoughtPanel(CutsceneBeatDto beat)
        {
            var panel = ToolkitStepUx.Instantiate(
                ToolkitStepTemplatePaths.CutsceneInnerMonologueBeat,
                "cutscene-thought-root");
            if (panel == null)
                return new VisualElement();

            SetBeatLabel(panel, "beat-title", beat.title, hideWhenEmpty: true);
            SetBeatLabel(panel, "beat-body", beat.body?.Trim() ?? string.Empty);
            return panel;
        }

        private VisualElement BuildGameInfoPanel(CutsceneBeatDto beat)
        {
            var panel = ToolkitStepUx.Instantiate(
                ToolkitStepTemplatePaths.CutsceneGameInfoBeat,
                "cutscene-gameinfo-root");
            if (panel == null)
                return new VisualElement();

            SetBeatLabel(panel, "beat-title", beat.title, hideWhenEmpty: true);
            SetBeatLabel(panel, "beat-body", beat.body?.Trim() ?? string.Empty);
            return panel;
        }

        private VisualElement BuildNpcDialog(CutsceneBeatDto beat)
        {
            var row = ToolkitStepUx.Instantiate(
                ToolkitStepTemplatePaths.CutsceneNpcDialogBeat,
                "cutscene-npc-root");
            if (row == null)
                return new VisualElement();

            var cast = ResolveCast(beat.speakerId);
            var side = (cast?.side ?? "right").Trim().ToLowerInvariant();
            if (side != "left")
                side = "right";

            row.RemoveFromClassList("lg-cutscene-npc--left");
            row.RemoveFromClassList("lg-cutscene-npc--right");
            row.AddToClassList(side == "left" ? "lg-cutscene-npc--left" : "lg-cutscene-npc--right");
            row.style.flexDirection = side == "left" ? FlexDirection.Row : FlexDirection.RowReverse;

            var portrait = row.Q<VisualElement>("npc-portrait");
            if (portrait != null && !string.IsNullOrWhiteSpace(cast?.portraitId))
                portrait.tooltip = cast.portraitId;

            SetBeatLabel(row, "npc-name", cast?.displayName, hideWhenEmpty: true);
            SetBeatLabel(row, "beat-body", beat.body?.Trim() ?? string.Empty);
            return row;
        }

        private static VisualElement InstantiateNarratorBeat() =>
            ToolkitStepUx.Instantiate(ToolkitStepTemplatePaths.CutsceneNarratorBeat, "cutscene-narrator-root");

        private CutsceneNpcCastEntryDto ResolveCast(string speakerId)
        {
            if (_dto?.npcCast == null || string.IsNullOrWhiteSpace(speakerId))
                return null;

            foreach (var entry in _dto.npcCast)
            {
                if (entry != null && string.Equals(entry.id, speakerId.Trim(), StringComparison.OrdinalIgnoreCase))
                    return entry;
            }

            return null;
        }

        private static void SetBeatLabel(VisualElement panel, string name, string text, bool hideWhenEmpty = false)
        {
            var label = panel.Q<Label>(name);
            ToolkitStepUx.SetOptionalLabel(label, text, hideWhenEmpty);
        }

        private static bool ResolveQuestBlockBack(string questMetaJson)
        {
            var meta = QuestMetaPayloadParser.Parse(questMetaJson);
            return meta?.flow != null && meta.flow.blockBack;
        }

        private static bool TryDeserialize(string json, out CutsceneContentDto dto, out string error)
        {
            dto = null;
            error = null;
            if (string.IsNullOrWhiteSpace(json))
            {
                error = "Missing content.";
                return false;
            }

            var trimmed = json.TrimStart();
            if (!trimmed.StartsWith("{", StringComparison.Ordinal))
            {
                error = "Cutscene content must be a JSON object.";
                return false;
            }

            dto = JsonUtility.FromJson<CutsceneContentDto>(json);
            if (dto == null)
            {
                error = "Could not parse cutscene content.";
                return false;
            }

            if (dto.beats == null || dto.beats.Length == 0)
            {
                dto = null;
                error = "Cutscene requires at least one beat.";
                return false;
            }

            for (var i = 0; i < dto.beats.Length; i++)
            {
                var beat = dto.beats[i];
                if (beat == null || string.IsNullOrWhiteSpace(beat.body))
                {
                    dto = null;
                    error = $"Beat {i} requires non-empty body.";
                    return false;
                }

                var modeRaw = string.IsNullOrWhiteSpace(beat.presentationMode)
                    ? "narrator"
                    : beat.presentationMode.Trim();
                if (!ValidPresentationModes.Contains(modeRaw))
                {
                    dto = null;
                    error = $"Beat {i} has invalid presentationMode '{modeRaw}'.";
                    return false;
                }

                beat.presentationMode = NormalizePresentationMode(modeRaw);

                if (string.Equals(beat.presentationMode, "npcDialog", StringComparison.Ordinal))
                {
                    if (string.IsNullOrWhiteSpace(beat.speakerId))
                    {
                        dto = null;
                        error = $"Beat {i} requires speakerId when presentationMode is npcDialog.";
                        return false;
                    }

                    if (dto.npcCast != null && dto.npcCast.Length > 0 &&
                        !NpcCastContainsSpeaker(dto.npcCast, beat.speakerId))
                    {
                        dto = null;
                        error = $"Beat {i} speakerId must match an id in npcCast.";
                        return false;
                    }
                }

                if (beat.autoAdvanceMs < 0)
                {
                    dto = null;
                    error = $"Beat {i} autoAdvanceMs must be a positive integer when set.";
                    return false;
                }
            }

            if (dto.npcCast != null)
            {
                for (var c = 0; c < dto.npcCast.Length; c++)
                {
                    if (!TryValidateNpcCastEntry(dto.npcCast[c], c, out error))
                    {
                        dto = null;
                        return false;
                    }
                }
            }

            return true;
        }

        private static bool TryValidateNpcCastEntry(CutsceneNpcCastEntryDto entry, int index, out string error)
        {
            error = null;
            if (entry == null || string.IsNullOrWhiteSpace(entry.id) ||
                string.IsNullOrWhiteSpace(entry.displayName))
            {
                error = $"npcCast[{index}] requires non-empty id and displayName.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(entry.side))
                return true;

            var side = entry.side.Trim();
            if (!side.Equals("left", StringComparison.OrdinalIgnoreCase) &&
                !side.Equals("right", StringComparison.OrdinalIgnoreCase))
            {
                error = $"npcCast[{index}].side must be 'left' or 'right'.";
                return false;
            }

            return true;
        }

        private static bool NpcCastContainsSpeaker(CutsceneNpcCastEntryDto[] npcCast, string speakerId)
        {
            var id = speakerId.Trim();
            foreach (var entry in npcCast)
            {
                if (entry != null && string.Equals(entry.id, id, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }

        private static string NormalizePresentationMode(string mode)
        {
            if (mode.Equals("npcDialog", StringComparison.OrdinalIgnoreCase))
                return "npcDialog";
            if (mode.Equals("innerMonologue", StringComparison.OrdinalIgnoreCase))
                return "innerMonologue";
            if (mode.Equals("gameInfo", StringComparison.OrdinalIgnoreCase))
                return "gameInfo";
            return "narrator";
        }
    }
}
