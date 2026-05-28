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
        private const string DefaultCtaLabel = "Avanti";
        private const string InvalidContentBody =
            "Inhalt fehlerhaft. Fortschritt ist blockiert, bis die Szene korrekt geladen ist.";
        private const string InvalidContentTitle = "Scena non disponibile";

        private static readonly HashSet<string> ValidPresentationModes = new(StringComparer.OrdinalIgnoreCase)
        {
            "narrator",
            "npcDialog",
            "innerMonologue",
            "gameInfo",
        };

        private static VisualTreeAsset s_narratorBeatTemplate;
        private static VisualTreeAsset s_npcDialogBeatTemplate;
        private static VisualTreeAsset s_innerMonologueBeatTemplate;
        private static VisualTreeAsset s_gameInfoBeatTemplate;

        private readonly bool _uiReady;
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
            _uiReady = ToolkitStepUx.TryMount(host, ToolkitStepTemplatePaths.CutsceneHost, "cutscene-root", out _root);
            _beatHost = _uiReady
                ? ToolkitStepUx.QueryRequired<VisualElement>(_root, "cutscene-beat-host", nameof(CutsceneToolkitStep))
                : null;
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            if (!ToolkitStepUx.GuardTemplateReady(_uiReady, context, _beatHost))
            {
                _isContentValid = false;
                return;
            }

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

        private void RenderInvalid() =>
            TryShowBeatMessage(InvalidContentTitle, InvalidContentBody);

        private void RenderTemplateFailure() =>
            TryShowBeatMessage("Scena non disponibile", ToolkitStepUx.TemplateLoadFailedMessage);

        private void TryShowBeatMessage(string title, string body)
        {
            ToolkitStepUx.ClearHost(_beatHost);
            var panel = InstantiateNarratorBeat();
            if (panel != null)
            {
                SetBeatLabel(panel, "beat-title", title);
                SetBeatLabel(panel, "beat-subtitle", string.Empty, hideWhenEmpty: true);
                SetBeatLabel(panel, "beat-body", body);
                _beatHost.Add(panel);
                return;
            }

            ToolkitStepUx.TryMountBeatFailurePanel(_beatHost, title, body);
        }

        private void RenderCurrentBeat()
        {
            ToolkitStepUx.ClearHost(_beatHost);
            if (_dto?.beats == null || _dto.beats.Length == 0)
            {
                _isContentValid = false;
                RenderInvalid();
                return;
            }

            var beat = _dto.beats[Mathf.Clamp(_beatIndex, 0, _dto.beats.Length - 1)];
            if (beat == null || string.IsNullOrWhiteSpace(beat.body))
            {
                _isContentValid = false;
                RenderInvalid();
                return;
            }

            if (!TryAddBeatPanel(BuildBeatPanel(beat)))
            {
                _isContentValid = false;
                return;
            }

            _isContentValid = true;
        }

        private VisualElement BuildBeatPanel(CutsceneBeatDto beat)
        {
            var mode = (beat.presentationMode ?? "narrator").Trim();
            return mode.ToLowerInvariant() switch
            {
                "npcdialog" => BuildNpcDialog(beat),
                "innermonologue" => BuildThoughtPanel(beat),
                "gameinfo" => BuildGameInfoPanel(beat),
                _ => BuildNarratorPanel(beat),
            };
        }

        private bool TryAddBeatPanel(VisualElement panel)
        {
            if (panel != null)
            {
                _beatHost.Add(panel);
                return true;
            }

            RenderTemplateFailure();
            return false;
        }

        private VisualElement BuildNarratorPanel(CutsceneBeatDto beat)
        {
            var panel = InstantiateNarratorBeat();
            if (panel == null)
                return null;

            SetBeatLabel(panel, "beat-title", beat.title, hideWhenEmpty: true);
            SetBeatLabel(panel, "beat-subtitle", beat.subtitle, hideWhenEmpty: true);
            SetBeatLabel(panel, "beat-body", beat.body?.Trim() ?? string.Empty);
            return panel;
        }

        private VisualElement BuildThoughtPanel(CutsceneBeatDto beat)
        {
            var panel = ToolkitStepUx.Instantiate(
                InnerMonologueBeatTemplate,
                ToolkitStepTemplatePaths.CutsceneInnerMonologueBeat,
                "cutscene-thought-root");
            if (panel == null)
                return null;

            var avatarSlot = panel.Q<VisualElement>("avatar-slot");
            if (avatarSlot != null)
                CutsceneAvatarSlotBinder.BindPlayerSlot(avatarSlot);

            SetBeatLabel(panel, "beat-title", beat.title, hideWhenEmpty: true);
            SetBeatLabel(panel, "beat-body", beat.body?.Trim() ?? string.Empty);
            return panel;
        }

        private VisualElement BuildGameInfoPanel(CutsceneBeatDto beat)
        {
            var panel = ToolkitStepUx.Instantiate(
                GameInfoBeatTemplate,
                ToolkitStepTemplatePaths.CutsceneGameInfoBeat,
                "cutscene-gameinfo-root");
            if (panel == null)
                return null;

            SetBeatLabel(panel, "beat-title", beat.title, hideWhenEmpty: true);
            SetBeatLabel(panel, "beat-body", beat.body?.Trim() ?? string.Empty);
            return panel;
        }

        private VisualElement BuildNpcDialog(CutsceneBeatDto beat)
        {
            var row = ToolkitStepUx.Instantiate(
                NpcDialogBeatTemplate,
                ToolkitStepTemplatePaths.CutsceneNpcDialogBeat,
                "cutscene-npc-root");
            if (row == null)
                return null;

            var cast = ResolveCast(beat.speakerId);
            var avatarSlot = row.Q<VisualElement>("avatar-slot");
            if (avatarSlot != null)
                CutsceneAvatarSlotBinder.BindNpcSlot(avatarSlot, cast?.portraitId);

            SetBeatLabel(row, "npc-name", cast?.displayName, hideWhenEmpty: true);
            SetBeatLabel(row, "beat-body", beat.body?.Trim() ?? string.Empty);
            return row;
        }

        private static VisualTreeAsset NarratorBeatTemplate =>
            s_narratorBeatTemplate ??= Resources.Load<VisualTreeAsset>(ToolkitStepTemplatePaths.CutsceneNarratorBeat);

        private static VisualTreeAsset NpcDialogBeatTemplate =>
            s_npcDialogBeatTemplate ??= Resources.Load<VisualTreeAsset>(ToolkitStepTemplatePaths.CutsceneNpcDialogBeat);

        private static VisualTreeAsset InnerMonologueBeatTemplate =>
            s_innerMonologueBeatTemplate ??=
                Resources.Load<VisualTreeAsset>(ToolkitStepTemplatePaths.CutsceneInnerMonologueBeat);

        private static VisualTreeAsset GameInfoBeatTemplate =>
            s_gameInfoBeatTemplate ??= Resources.Load<VisualTreeAsset>(ToolkitStepTemplatePaths.CutsceneGameInfoBeat);

        private static VisualElement InstantiateNarratorBeat() =>
            ToolkitStepUx.Instantiate(NarratorBeatTemplate, ToolkitStepTemplatePaths.CutsceneNarratorBeat, "cutscene-narrator-root");

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
                error = "Impossibile leggere il contenuto della scena.";
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
                    error = $"Il beat {i} ha presentationMode non valido: '{modeRaw}'.";
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
