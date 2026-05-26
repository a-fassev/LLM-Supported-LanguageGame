using System;
using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Cutscene beats in UI Toolkit; local beat pager then quest shell advance RPC.</summary>
    public sealed class CutsceneToolkitStep : IStepView, ICutsceneBeatNavigator
    {
        private const string DefaultCtaLabel = "Weiter";
        private const string PlaceholderBody =
            "Contenuto non disponibile. Premi Weiter per continuare.";

        private readonly VisualElement _root;
        private readonly VisualElement _beatHost;

        private CutsceneContentDto _dto;
        private int _beatIndex;
        private Coroutine _autoAdvanceCoroutine;
        private MonoBehaviour _coroutineHost;
        private Action<StepCompletionRequest> _onRequest;
        private bool _questBlockBack;

        public CutsceneToolkitStep(VisualElement host)
        {
            _root = new VisualElement();
            _root.style.flexGrow = 1;
            _root.AddToClassList("lg-cutscene-root");

            _beatHost = new VisualElement();
            _beatHost.style.flexGrow = 1;
            _root.Add(_beatHost);

            host.Add(_root);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _onRequest = onRequest;
            _coroutineHost = context?.coroutineHost;
            _questBlockBack = ResolveQuestBlockBack(context?.questMetaJson);
            _beatIndex = 0;

            if (!TryDeserialize(context?.contentJson, out _dto, out _))
            {
                _dto = null;
                RenderInvalid();
                return;
            }

            RenderCurrentBeat();
            ScheduleAutoAdvanceForCurrentBeat();
        }

        public bool TryAdvanceBeat()
        {
            CancelAutoAdvance();
            if (_dto?.beats == null || _dto.beats.Length == 0)
                return false;

            if (_beatIndex >= _dto.beats.Length - 1)
                return false;

            _beatIndex++;
            RenderCurrentBeat();
            ScheduleAutoAdvanceForCurrentBeat();
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
            if (TryAdvanceBeat())
                return;

            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        private void CancelAutoAdvance()
        {
            if (_autoAdvanceCoroutine != null && _coroutineHost != null)
                _coroutineHost.StopCoroutine(_autoAdvanceCoroutine);
            _autoAdvanceCoroutine = null;
        }

        private void RenderInvalid()
        {
            _beatHost.Clear();
            var panel = CreateNarratorPanel();
            SetLabelText(panel, "title", "Cutscene");
            SetLabelText(panel, "subtitle", string.Empty, hideWhenEmpty: true);
            SetLabelText(panel, "body", PlaceholderBody);
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
            var panel = CreateNarratorPanel();
            SetLabelText(panel, "title", beat.title, hideWhenEmpty: true);
            SetLabelText(panel, "subtitle", beat.subtitle, hideWhenEmpty: true);
            SetLabelText(panel, "body", beat.body?.Trim() ?? PlaceholderBody);
            return panel;
        }

        private VisualElement BuildThoughtPanel(CutsceneBeatDto beat)
        {
            var panel = new VisualElement();
            panel.AddToClassList("lg-cutscene-thought");

            var bubble = new VisualElement();
            bubble.AddToClassList("lg-cutscene-thought__bubble");

            if (!string.IsNullOrWhiteSpace(beat.title))
            {
                var title = new Label(beat.title.Trim());
                title.AddToClassList("lg-cutscene-thought__title");
                bubble.Add(title);
            }

            var body = new Label(beat.body.Trim());
            body.AddToClassList("lg-cutscene-thought__body");
            body.style.whiteSpace = WhiteSpace.Normal;
            bubble.Add(body);

            panel.Add(bubble);
            return panel;
        }

        private VisualElement BuildGameInfoPanel(CutsceneBeatDto beat)
        {
            var panel = new VisualElement();
            panel.AddToClassList("lg-cutscene-gameinfo");

            var icon = new Label("i");
            icon.AddToClassList("lg-cutscene-gameinfo__icon");
            panel.Add(icon);

            var textCol = new VisualElement();
            textCol.AddToClassList("lg-cutscene-gameinfo__text");

            if (!string.IsNullOrWhiteSpace(beat.title))
            {
                var title = new Label(beat.title.Trim());
                title.AddToClassList("lg-cutscene-gameinfo__title");
                textCol.Add(title);
            }

            var body = new Label(beat.body.Trim());
            body.AddToClassList("lg-cutscene-gameinfo__body");
            body.style.whiteSpace = WhiteSpace.Normal;
            textCol.Add(body);

            panel.Add(textCol);
            return panel;
        }

        private VisualElement BuildNpcDialog(CutsceneBeatDto beat)
        {
            var row = new VisualElement();
            row.AddToClassList("lg-cutscene-npc");

            var cast = ResolveCast(beat.speakerId);
            var side = (cast?.side ?? "right").Trim().ToLowerInvariant();
            if (side != "left")
                side = "right";

            row.AddToClassList(side == "left" ? "lg-cutscene-npc--left" : "lg-cutscene-npc--right");

            var portrait = new VisualElement();
            portrait.AddToClassList("lg-cutscene-npc__portrait");
            if (!string.IsNullOrWhiteSpace(cast?.portraitId))
                portrait.tooltip = cast.portraitId;

            var bubbleCol = new VisualElement();
            bubbleCol.AddToClassList("lg-cutscene-npc__bubble-col");

            if (!string.IsNullOrWhiteSpace(cast?.displayName))
            {
                var name = new Label(cast.displayName.Trim());
                name.AddToClassList("lg-cutscene-npc__name");
                bubbleCol.Add(name);
            }

            var bubble = new VisualElement();
            bubble.AddToClassList("lg-cutscene-npc__bubble");
            var body = new Label(beat.body.Trim());
            body.AddToClassList("lg-cutscene-npc__body");
            body.style.whiteSpace = WhiteSpace.Normal;
            bubble.Add(body);
            bubbleCol.Add(bubble);

            if (side == "left")
            {
                row.Add(portrait);
                row.Add(bubbleCol);
            }
            else
            {
                row.Add(bubbleCol);
                row.Add(portrait);
            }

            return row;
        }

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

        private static VisualElement CreateNarratorPanel()
        {
            var panel = new VisualElement();
            panel.AddToClassList("lg-cutscene-narrator");

            var title = new Label();
            title.name = "title";
            title.AddToClassList("lg-cutscene-narrator__title");
            title.style.display = DisplayStyle.None;
            panel.Add(title);

            var subtitle = new Label();
            subtitle.name = "subtitle";
            subtitle.AddToClassList("lg-cutscene-narrator__subtitle");
            subtitle.style.display = DisplayStyle.None;
            panel.Add(subtitle);

            var body = new Label();
            body.name = "body";
            body.AddToClassList("lg-cutscene-narrator__body");
            body.style.whiteSpace = WhiteSpace.Normal;
            panel.Add(body);

            return panel;
        }

        private static void SetLabelText(VisualElement panel, string name, string text, bool hideWhenEmpty = false)
        {
            var label = panel.Q<Label>(name);
            if (label == null)
                return;

            if (hideWhenEmpty && string.IsNullOrWhiteSpace(text))
            {
                label.style.display = DisplayStyle.None;
                label.text = string.Empty;
                return;
            }

            label.style.display = DisplayStyle.Flex;
            label.text = text ?? string.Empty;
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

                if (string.IsNullOrWhiteSpace(beat.presentationMode))
                    beat.presentationMode = "narrator";
            }

            return true;
        }
    }
}
