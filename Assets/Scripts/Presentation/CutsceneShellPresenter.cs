using System;
using System.Collections;
using LanguageGame.Application;
using LanguageGame.Presentation.Steps;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Minimal cutscene shell: pause + full-stage step host + Weiter CTA.</summary>
    public sealed class CutsceneShellPresenter : IQuestStepShellPresenter
    {
        private readonly MonoBehaviour _host;
        private readonly QuestShellSharedRuntime _shared;
        private readonly Action _requestHostRefresh;

        private UIDocument _toolkitDoc;
        private bool _shellReady;
        private VisualElement _stepHost;
        private VisualElement _sceneBackgroundHost;
        private Button _tkPauseMenu;
        private Button _tkPrimary;

        private IStepView _activeStepView;
        private GameQuestStepDto _boundStep;
        private string _boundQuestMetaJson;

        private readonly EventCallback<ClickEvent> _onPauseMenuClicked;
        private readonly EventCallback<ClickEvent> _onPrimaryChromeClicked;

        public CutsceneShellPresenter(MonoBehaviour host, QuestShellSharedRuntime shared, Action requestHostRefresh)
        {
            _host = host;
            _shared = shared;
            _requestHostRefresh = requestHostRefresh;
            _onPauseMenuClicked = _ => OnPauseMenuClicked();
            _onPrimaryChromeClicked = _ => OnPrimaryChromeClicked();
        }

        public bool IsMounted => _shellReady;

        public void Mount()
        {
            if (_shellReady)
                return;

            _shared.ResolveGameApi();
            _toolkitDoc = LearningToolkitBootstrap.SpawnUiDocument(_host, "Shells/CutShellScreen");
            if (_toolkitDoc == null)
                return;

            var root = _toolkitDoc.rootVisualElement;
            _tkPauseMenu = root.Q<Button>(LearningToolkitChromeUx.PauseMenuButtonName);
            _tkPrimary = root.Q<Button>("primary-action-button");
            _stepHost = root.Q<VisualElement>("step-host");
            _sceneBackgroundHost = root.Q<VisualElement>(ToolkitSceneBackgroundBinder.SceneBackgroundHostName);

            if (_tkPauseMenu == null || _tkPrimary == null || _stepHost == null)
            {
                Debug.LogError("[CutsceneShellPresenter] CutShellScreen UXML missing required elements.");
                DestroyDocument();
                return;
            }

            var overlay = LearningToolkitBootstrap.ResolveOverlayPlane(_toolkitDoc);
            if (overlay == null)
            {
                Debug.LogError("[CutsceneShellPresenter] CutShellScreen UXML missing overlay-plane.");
                DestroyDocument();
                return;
            }

            _shared.AttachOverlays(overlay);
            _tkPauseMenu.RegisterCallback(_onPauseMenuClicked);
            _tkPrimary.RegisterCallback(_onPrimaryChromeClicked);
            LearningToolkitNavigationFeedback.RegisterPresentationDocument(_toolkitDoc);
            _shellReady = true;
        }

        public void Unmount()
        {
            UnregisterChromeCallbacks();
            if (_toolkitDoc != null)
                LearningToolkitNavigationFeedback.UnregisterPresentationDocument(_toolkitDoc);
            TeardownBoundStep();
            DestroyDocument();
            _shellReady = false;
        }

        public void RefreshUi()
        {
            if (!_shellReady)
                return;

            var flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[CutsceneShellPresenter] GameFlowController not found.");
                return;
            }

            if (!flow.IsServerQuestActive || !flow.TryGetCurrentServerStep(out var step) || step.isTask)
            {
                _requestHostRefresh?.Invoke();
                return;
            }

            if (_tkPauseMenu != null)
                _tkPauseMenu.SetEnabled(!_shared.Session.Submitting && flow.IsServerQuestActive);

            BindStep(step, flow);
            ApplySceneBackground(step);
            ConfigurePrimaryChrome();
        }

        private void BindStep(GameQuestStepDto step, GameFlowController flow)
        {
            var questMetaJson = flow.ServerQuestMetaJson ?? string.Empty;
            if (_boundStep != null &&
                QuestShellSharedRuntime.SameStepBindingForUi(_boundStep, step) &&
                string.Equals(_boundQuestMetaJson ?? string.Empty, questMetaJson, StringComparison.Ordinal))
                return;

            TeardownBoundStep();

            _stepHost.Clear();
            _activeStepView = ToolkitStepFactory.Create(step, _stepHost, _host);
            if (_activeStepView == null)
            {
                Debug.LogError(
                    $"[CutsceneShellPresenter] Factory returned null for cutscene stepId={step.id}");
                _activeStepView = StubToolkitTaskStep.CreateMissingFactoryFallback(_stepHost, step);
            }

            _boundStep = step;
            _boundQuestMetaJson = questMetaJson;

            _activeStepView.Bind(BuildStepContext(flow, step), OnStepRequest);
            _activeStepView.SetInteractable(!_shared.Session.Submitting);
            ApplySceneBackground(step);
        }

        private void ApplySceneBackground(GameQuestStepDto step)
        {
            if (_sceneBackgroundHost == null || step == null)
                return;
            ToolkitSceneBackgroundBinder.BindFromContentJson(_sceneBackgroundHost, step.contentJson, isCutsceneStep: true);
        }

        private StepContext BuildStepContext(GameFlowController flow, GameQuestStepDto step) =>
            new()
            {
                runId = flow.ServerRunId,
                stepId = step.id,
                taskId = step.id,
                questId = flow.ServerQuestId,
                questDisplayName = flow.ServerQuestDisplayName,
                questMetaJson = flow.ServerQuestMetaJson,
                coroutineHost = _host,
                onCutsceneBeatChanged = RefreshCutsceneChrome,
                stepKind = step.stepKind,
                taskType = step.taskType,
                templateKey = step.templateKey,
                contentJson = step.contentJson,
                rewardRulesJson = step.rewardRulesJson,
                stepIndexZeroBased = Mathf.Max(0, flow.ServerCurrentStepNumberOneBased - 1),
                totalSteps = flow.ServerStepCount,
                isLastStep = flow.ServerCurrentStepNumberOneBased == flow.ServerStepCount,
                totalSlices = flow.TotalPizzaSlices,
                totalBackpackPieces = flow.TotalBackpackPieces,
                presentValidationMessage = _shared.PresentValidationMessage,
                presentBusyOverlay = msg =>
                    _shared.Loading.Show(string.IsNullOrWhiteSpace(msg) ? "Laden…" : msg),
                dismissBusyOverlay = () => _shared.Loading.Hide(),
                gameProgressApi = _shared.GameApi,
            };

        private void OnStepRequest(StepCompletionRequest request)
        {
            if (request.requestBackToChapters)
            {
                QuestShellNavigationUx.TryLeaveQuest(_shared, _activeStepView, nameof(CutsceneShellPresenter));
                return;
            }

            if (!request.requestComplete)
                return;

            if (_boundStep == null)
                return;

            if (_activeStepView is ICutsceneBeatNavigator invalidNav && !invalidNav.IsContentValid)
            {
                Debug.LogWarning("[CutsceneShellPresenter] Cutscene advance blocked — invalid contentJson.");
                return;
            }

            if (_shared.GameApi == null || _shared.Session.Submitting || string.IsNullOrEmpty(_boundStep.id))
                return;

            _host.StartCoroutine(AdvanceCutsceneRoutine(_boundStep.id));
        }

        private void OnPrimaryChromeClicked()
        {
            if (_activeStepView is ICutsceneBeatNavigator cutsceneNav)
            {
                if (!cutsceneNav.IsContentValid)
                    return;

                cutsceneNav.OnShellPrimaryPressed();
                if (cutsceneNav.TryAdvanceBeat())
                    return;
            }

            OnStepRequest(new StepCompletionRequest { requestComplete = true });
        }

        private void ConfigurePrimaryChrome()
        {
            if (_tkPrimary == null || _boundStep == null)
                return;

            var cutsceneValid = _activeStepView is not ICutsceneBeatNavigator nav || nav.IsContentValid;
            _tkPrimary.text = ResolveCutsceneCtaLabel();
            _tkPrimary.SetEnabled(cutsceneValid && !_shared.Session.Submitting && _shared.GameApi != null);
            _tkPrimary.style.display = DisplayStyle.Flex;
        }

        private void RefreshCutsceneChrome() => ConfigurePrimaryChrome();

        private string ResolveCutsceneCtaLabel()
        {
            if (_activeStepView is ICutsceneBeatNavigator nav)
            {
                var label = nav.GetPrimaryCtaLabel();
                if (!string.IsNullOrWhiteSpace(label))
                    return label.Trim();
            }

            return QuestShellSharedRuntime.ShellCutsceneDefaultCtaLabel;
        }

        private IEnumerator AdvanceCutsceneRoutine(string cutsceneStepId)
        {
            var flow = GameFlowController.Instance;
            if (flow == null || _shared.GameApi == null || string.IsNullOrEmpty(cutsceneStepId))
                yield break;

            if (_boundStep == null ||
                _boundStep.isTask ||
                !flow.TryGetCurrentServerStep(out var curC) ||
                curC?.id != cutsceneStepId)
            {
                Debug.LogWarning("[CutsceneShellPresenter] Cutscene advance skipped — stale binding; refreshing.");
                RefreshUi();
                yield break;
            }

            _shared.Session.Submitting = true;
            _activeStepView?.SetInteractable(false);
            ConfigurePrimaryChrome();

            _shared.Loading.Show("Speichern…");

            var runId = flow.ServerRunId;
            var useCase = new AdvanceCutsceneUseCase(_shared.GameApi);
            GameCompleteTaskEnvelope done = null;
            var err = string.Empty;
            yield return useCase.Run(runId, cutsceneStepId, d => done = d, m => err = m);

            _shared.Loading.Hide();
            _shared.Session.Submitting = false;

            if (done == null || !done.ok)
            {
                Debug.LogWarning($"[CutsceneShellPresenter] Cutscene advance failed: {err}");
                if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                    GameFlowController.Instance?.LoadAuth();
                else
                {
                    _activeStepView?.SetInteractable(true);
                    ConfigurePrimaryChrome();
                }

                yield break;
            }

            flow.ApplyServerTaskProgress(done.currentStepOrderIndex, done.currentTaskOrderIndex, done.totalSlices,
                done.totalBackpackPieces, questComplete: false);

            if (done.questComplete)
            {
                _shared.Session.PendingFinishRunId = flow.ServerRunId;
                _requestHostRefresh?.Invoke();
                _host.StartCoroutine(_shared.FinishPendingRunRoutine(_shared.Session.PendingFinishRunId,
                    () => _requestHostRefresh?.Invoke(), null));
                yield break;
            }

            _requestHostRefresh?.Invoke();
        }

        private void OnPauseMenuClicked() =>
            QuestShellNavigationUx.ShowPauseMenu(_shared, _activeStepView);

        private void UnregisterChromeCallbacks()
        {
            _tkPauseMenu?.UnregisterCallback(_onPauseMenuClicked);
            _tkPrimary?.UnregisterCallback(_onPrimaryChromeClicked);
        }

        private void TeardownBoundStep()
        {
            if (_activeStepView is ICutsceneBeatNavigator cutsceneNav)
                cutsceneNav.TeardownBeatNavigation();

            _activeStepView?.Teardown();
            _activeStepView = null;
            _boundStep = null;
            _boundQuestMetaJson = null;
            if (_shellReady && _stepHost != null)
                _stepHost.Clear();
        }

        private void DestroyDocument()
        {
            if (_toolkitDoc != null)
                UnityEngine.Object.Destroy(_toolkitDoc.gameObject);
            _toolkitDoc = null;
            _stepHost = null;
            _tkPauseMenu = null;
            _tkPrimary = null;
        }
    }
}
