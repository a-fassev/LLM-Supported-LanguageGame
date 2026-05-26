using System;
using System.Collections;
using LanguageGame.Application;
using LanguageGame.Presentation.Steps;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Task quest shell: title, wallet, brochure, task panel, Controlla / reward flow.</summary>
    public sealed class TaskShellPresenter : IQuestStepShellPresenter
    {
        private readonly MonoBehaviour _host;
        private readonly QuestShellSharedRuntime _shared;
        private readonly Action _requestHostRefresh;

        private UIDocument _toolkitDoc;
        private bool _shellReady;
        private VisualElement _toolkitStepHost;
        private VisualElement _questStepPanel;
        private Button _tkReferenceDocument;
        private Button _tkPauseMenu;
        private Button _tkPrimary;
        private Label _tkQuestTitle;
        private Label _tkWalletPizza;
        private Label _tkWalletBackpack;

        private IStepView _activeStepView;
        private GameQuestStepDto _boundStep;
        private string _boundQuestMetaJson;

        public TaskShellPresenter(MonoBehaviour host, QuestShellSharedRuntime shared, Action requestHostRefresh)
        {
            _host = host;
            _shared = shared;
            _requestHostRefresh = requestHostRefresh;
        }

        public bool IsMounted => _shellReady;

        public void Mount()
        {
            if (_shellReady)
                return;

            _shared.ResolveGameApi();
            if (_shared.GameApi == null)
                Debug.LogWarning("[TaskShellPresenter] GameProgressApiClient missing; online progression unavailable.");

            _toolkitDoc = LearningToolkitBootstrap.SpawnUiDocument(_host, "TaskShellScreen");
            if (_toolkitDoc == null)
                return;

            var root = _toolkitDoc.rootVisualElement;
            _tkReferenceDocument = root.Q<Button>("reference-document-button");
            _tkPauseMenu = root.Q<Button>(LearningToolkitChromeUx.PauseMenuButtonName);
            _tkPrimary = root.Q<Button>("primary-action-button");
            _tkQuestTitle = root.Q<Label>("quest-title-label");
            _tkWalletPizza = root.Q<Label>("wallet-pizza");
            _tkWalletBackpack = root.Q<Label>("wallet-backpack");
            _toolkitStepHost = root.Q<VisualElement>("step-host");
            _questStepPanel = root.Q<VisualElement>("quest-step-panel");

            if (_tkPauseMenu == null || _tkPrimary == null || _toolkitStepHost == null)
            {
                Debug.LogError("[TaskShellPresenter] TaskShellScreen UXML missing required elements.");
                DestroyDocument();
                return;
            }

            var overlay = LearningToolkitBootstrap.ResolveOverlayPlane(_toolkitDoc);
            if (overlay == null)
            {
                Debug.LogError("[TaskShellPresenter] TaskShellScreen UXML missing overlay-plane.");
                DestroyDocument();
                return;
            }

            _shared.AttachOverlays(overlay);
            _tkReferenceDocument?.RegisterCallback<ClickEvent>(_ => OnReferenceDocumentClicked());
            _tkPauseMenu.RegisterCallback<ClickEvent>(_ => OnPauseMenuClicked());
            _tkPrimary.RegisterCallback<ClickEvent>(_ => OnPrimaryChromeClicked());
            LearningToolkitNavigationFeedback.RegisterPresentationDocument(_toolkitDoc);
            _shellReady = true;
        }

        public void Unmount()
        {
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

            UpdateWalletLabels();

            var flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[TaskShellPresenter] GameFlowController not found.");
                return;
            }

            if (!flow.IsServerQuestActive)
            {
                ClearQuestDifficultyChrome();
                return;
            }

            if (!string.IsNullOrEmpty(_shared.Session.PendingFinishRunId))
            {
                ClearQuestDifficultyChrome();
                var titleFinishing = string.IsNullOrEmpty(flow.ServerQuestDisplayName)
                    ? "Quest wird abgeschlossen…"
                    : flow.ServerQuestDisplayName;
                if (_tkQuestTitle != null)
                    _tkQuestTitle.text = titleFinishing;

                if (_tkPrimary != null)
                {
                    _tkPrimary.text = QuestShellSharedRuntime.FinishQuestLabel;
                    _tkPrimary.SetEnabled(!_shared.Session.Submitting && _shared.GameApi != null);
                    _tkPrimary.style.display = DisplayStyle.Flex;
                }

                ConfigureTaskShellChrome(flow);
                return;
            }

            if (!flow.TryGetCurrentServerStep(out var step))
            {
                var titleDone = string.IsNullOrEmpty(flow.ServerQuestDisplayName)
                    ? "Quest abgeschlossen"
                    : flow.ServerQuestDisplayName;
                if (_tkQuestTitle != null)
                    _tkQuestTitle.text = titleDone;
                if (_tkPrimary != null)
                {
                    _tkPrimary.text = QuestShellSharedRuntime.FinishQuestLabel;
                    _tkPrimary.SetEnabled(false);
                    _tkPrimary.style.display = DisplayStyle.Flex;
                }

                TeardownBoundStep();
                ConfigureTaskShellChrome(flow);
                return;
            }

            if (!step.isTask)
            {
                _requestHostRefresh?.Invoke();
                return;
            }

            if (_tkQuestTitle != null)
                _tkQuestTitle.text =
                    $"{flow.ServerQuestDisplayName} — Step {flow.ServerCurrentStepNumberOneBased}/{flow.ServerStepCount}";

            BindStep(step, flow);
            ConfigurePrimaryChrome();
            ConfigureTaskShellChrome(flow);
            ApplyQuestShellDifficultyChrome(step);
        }

        private void BindStep(GameQuestStepDto step, GameFlowController flow)
        {
            var questMetaJson = flow.ServerQuestMetaJson ?? string.Empty;
            if (_boundStep != null &&
                QuestShellSharedRuntime.SameStepBindingForUi(_boundStep, step) &&
                string.Equals(_boundQuestMetaJson ?? string.Empty, questMetaJson, StringComparison.Ordinal))
                return;

            TeardownBoundStep();

            _toolkitStepHost.Clear();
            _activeStepView = ToolkitStepFactory.Create(step, _toolkitStepHost, _host);
            if (_activeStepView == null)
            {
                Debug.LogError(
                    $"[TaskShellPresenter] Factory returned null — stepId={step.id} taskType={step.taskType}");
                _activeStepView = StubToolkitTaskStep.CreateMissingFactoryFallback(_toolkitStepHost, step);
            }

            _boundStep = step;
            _boundQuestMetaJson = questMetaJson;

            _activeStepView.Bind(BuildStepContext(flow, step), OnStepRequest);
            _activeStepView.SetInteractable(!_shared.Session.Submitting);

            _shared.ResetRewardOverlayToRewardLayout();
            _shared.HideRewardOverlay();
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
                OnBackToChaptersClicked();
                return;
            }

            if (!request.requestComplete)
                return;

            if (_boundStep == null || !_boundStep.isTask)
                return;

            if (_shared.GameApi == null || _shared.Session.Submitting || string.IsNullOrEmpty(_boundStep.id))
                return;

            _host.StartCoroutine(CompleteServerTaskRoutine(_boundStep.id, request.taskAttemptJson));
        }

        private void OnPrimaryChromeClicked()
        {
            if (!string.IsNullOrEmpty(_shared.Session.PendingFinishRunId))
            {
                if (!_shared.Session.Submitting && _shared.GameApi != null)
                    _host.StartCoroutine(_shared.FinishPendingRunRoutine(_shared.Session.PendingFinishRunId,
                        RefreshUi, ReenableFinishPrimary));
                return;
            }

            if (_boundStep != null && _boundStep.isTask)
            {
                if (_activeStepView is ISubmitFromShell submit)
                    submit.SubmitFromShell();
                else if (_activeStepView != null)
                    Debug.LogWarning(
                        "[TaskShellPresenter] Task step does not implement ISubmitFromShell; Controlla did nothing. " +
                        $"Step type: {_activeStepView.GetType().Name}");
                else
                    Debug.LogWarning("[TaskShellPresenter] Controlla pressed but no active step view.");
            }
        }

        private void ReenableFinishPrimary()
        {
            if (_tkPrimary == null)
                return;

            _tkPrimary.text = QuestShellSharedRuntime.FinishQuestLabel;
            _tkPrimary.SetEnabled(true);
            _tkPrimary.style.display = DisplayStyle.Flex;
        }

        private void ConfigurePrimaryChrome()
        {
            if (_boundStep == null || _tkPrimary == null)
                return;

            _tkPrimary.text = QuestShellSharedRuntime.ShellTaskCheckLabel;
            _tkPrimary.SetEnabled(!_shared.Session.Submitting && _shared.GameApi != null);
            _tkPrimary.style.display = DisplayStyle.Flex;
        }

        private void ConfigureTaskShellChrome(GameFlowController flow)
        {
            var meta = flow?.ServerQuestMeta;
            var hasReference = QuestMetaPayloadParser.HasReferenceDocument(meta);

            if (_tkReferenceDocument != null)
            {
                if (hasReference)
                {
                    var label = meta.referenceDocument.buttonLabel;
                    _tkReferenceDocument.text = string.IsNullOrWhiteSpace(label)
                        ? "Broschüre ansehen"
                        : label.Trim();
                    _tkReferenceDocument.style.display = DisplayStyle.Flex;
                    _tkReferenceDocument.SetEnabled(!_shared.Session.Submitting);
                }
                else
                {
                    _tkReferenceDocument.style.display = DisplayStyle.None;
                }
            }

            if (_tkPauseMenu != null)
                _tkPauseMenu.SetEnabled(!_shared.Session.Submitting && flow != null && flow.IsServerQuestActive);
        }

        private void ApplyQuestShellDifficultyChrome(GameQuestStepDto step)
        {
            var hard = ShouldUseHardTaskChrome(step);
            if (_questStepPanel != null)
                _questStepPanel.EnableInClassList("lg-game-panel--hard", hard);

            if (_tkPrimary != null)
            {
                var isTask = step != null && step.isTask;
                _tkPrimary.EnableInClassList("lg-btn--primary-hard", hard && isTask);
            }
        }

        private void ClearQuestDifficultyChrome()
        {
            if (_questStepPanel != null)
                _questStepPanel.RemoveFromClassList("lg-game-panel--hard");
            if (_tkPrimary != null)
                _tkPrimary.RemoveFromClassList("lg-btn--primary-hard");
        }

        private IEnumerator CompleteServerTaskRoutine(string taskStepId, string taskAttemptJson = null)
        {
            var flow = GameFlowController.Instance;
            if (flow == null || _shared.GameApi == null || string.IsNullOrEmpty(taskStepId))
                yield break;

            if (_boundStep == null ||
                !_boundStep.isTask ||
                !flow.TryGetCurrentServerStep(out var cur) ||
                cur?.id != taskStepId)
            {
                Debug.LogWarning("[TaskShellPresenter] Task submit skipped — stale binding; refreshing.");
                RefreshUi();
                yield break;
            }

            _shared.Session.Submitting = true;
            _activeStepView?.SetInteractable(false);
            RefreshUi();

            _shared.Loading.Show("Wird geprüft…");

            var runId = flow.ServerRunId;

            string evaluationGateToken = null;
            if (_activeStepView is IEvaluationGateForTaskCompletion gateCarrier &&
                gateCarrier.TryTakeEvaluationGateToken(out var tokenFromStep) &&
                !string.IsNullOrWhiteSpace(tokenFromStep))
            {
                evaluationGateToken = tokenFromStep;
            }

            var serverScoredPizza = QuestScoringPolicy.ServerScoresPizza(_boundStep.rewardRulesJson);
            var isFreitextLlm = string.Equals(_boundStep.taskType, "FreitextLlm", StringComparison.Ordinal);

            if (serverScoredPizza && !isFreitextLlm && string.IsNullOrWhiteSpace(taskAttemptJson))
            {
                _shared.Loading.Hide();
                _shared.Session.Submitting = false;
                Debug.LogWarning("[TaskShellPresenter] Scored pizza task submitted without attempt JSON.");
                _shared.PresentValidationMessage("Impossibile inviare il compito. Riprova.");
                _activeStepView?.SetInteractable(true);
                RefreshUi();
                yield break;
            }

            if (!serverScoredPizza || isFreitextLlm)
                taskAttemptJson = null;

            var useCase = new CompleteTaskUseCase(_shared.GameApi);
            GameCompleteTaskEnvelope done = null;
            var err = string.Empty;
            yield return useCase.Run(runId, taskStepId, d => done = d, m => err = m, evaluationGateToken,
                taskAttemptJson);

            _shared.Loading.Hide();

            if (done == null || !done.ok)
            {
                _shared.Session.Submitting = false;
                Debug.LogWarning($"[TaskShellPresenter] Complete task failed: {err}");
                if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                    GameFlowController.Instance?.LoadAuth();
                else
                {
                    _activeStepView?.SetInteractable(true);
                    RefreshUi();
                }

                yield break;
            }

            _shared.Session.Submitting = false;
            _shared.Session.HasPendingAdvance = true;
            _shared.Session.PendingRunId = runId;
            _shared.Session.PendingStepOrderIndex = done.currentStepOrderIndex;
            _shared.Session.PendingTaskOrderIndex = done.currentTaskOrderIndex;
            _shared.Session.PendingTotalSlices = done.totalSlices;
            _shared.Session.PendingTotalBackpackPieces = done.totalBackpackPieces;
            _shared.Session.PendingQuestComplete = done.questComplete;
            flow.SetTotalPizzaSlices(done.totalSlices);
            flow.SetTotalBackpackPieces(done.totalBackpackPieces);
            UpdateWalletLabels();
            _shared.ShowTaskRewardOverlay(done.awardedSlices, done.awardedBackpackPieces, done.taskItemsCorrect,
                done.taskItemsTotal, OnToolkitRewardBackDismiss, OnToolkitRewardNextDismiss);
            _activeStepView?.SetInteractable(false);
        }

        private void OnToolkitRewardBackDismiss()
        {
            if (_shared.Session.RewardOverlayValidationMode)
            {
                _shared.HideRewardOverlay();
                _shared.ResetRewardOverlayToRewardLayout();
                return;
            }

            _shared.HideRewardOverlay();
        }

        private void OnToolkitRewardNextDismiss()
        {
            if (_shared.Session.RewardOverlayValidationMode)
                return;

            _shared.HideRewardOverlay();
            _shared.ApplyPendingAdvanceAndContinue(_requestHostRefresh);
        }

        private void OnReferenceDocumentClicked()
        {
            if (_shared.Session.Submitting)
                return;

            var flow = GameFlowController.Instance;
            if (flow == null)
                return;

            var doc = flow.ServerQuestMeta?.referenceDocument;
            if (doc == null || string.IsNullOrWhiteSpace(doc.bodyText))
                return;

            _shared.ReferenceDoc.Show(doc.title, doc.bodyText);
        }

        private void OnPauseMenuClicked()
        {
            if (_shared.Session.Submitting)
                return;

            _shared.PauseMenuModal.Show(
                () => _shared.PauseMenuModal.Hide(),
                OnPauseLeaveQuest,
                leaveEnabled: !_shared.IsBackBlocked(_activeStepView),
                LearningToolkitChromeUx.LeaveToChapterOverviewLabel);
        }

        private void OnPauseLeaveQuest()
        {
            _shared.PauseMenuModal.Hide();
            OnBackToChaptersClicked();
        }

        private void OnBackToChaptersClicked()
        {
            var flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[TaskShellPresenter] GameFlowController not found.");
                return;
            }

            if (_shared.Session.Submitting || flow.IsSceneTransitionInProgress)
                return;

            if (_shared.IsBackBlocked(_activeStepView))
                return;

            if (flow.IsServerQuestActive)
            {
                if (flow.TryGetCurrentServerStep(out _))
                {
                    _shared.ShowBackConfirm(() => _shared.HideBackConfirm(), () =>
                    {
                        _shared.HideBackConfirm();
                        flow.LoadChapterOverview();
                    });
                    return;
                }

                flow.LoadChapterOverview();
                return;
            }

            flow.LoadChapterOverview();
        }

        private void UpdateWalletLabels()
        {
            var slices = WalletUiTotals.GetDisplayedPizzaSlices();
            var backpack = WalletUiTotals.GetDisplayedBackpackPieces();

            if (_tkWalletPizza != null)
                _tkWalletPizza.text = slices.ToString();
            if (_tkWalletBackpack != null)
                _tkWalletBackpack.text = backpack.ToString();
        }

        private void TeardownBoundStep()
        {
            ClearQuestDifficultyChrome();
            _activeStepView?.Teardown();
            _activeStepView = null;
            _boundStep = null;
            _boundQuestMetaJson = null;
            if (_shellReady && _toolkitStepHost != null)
                _toolkitStepHost.Clear();
        }

        private void DestroyDocument()
        {
            if (_toolkitDoc != null)
                UnityEngine.Object.Destroy(_toolkitDoc.gameObject);
            _toolkitDoc = null;
            _toolkitStepHost = null;
            _questStepPanel = null;
            _tkReferenceDocument = null;
            _tkPauseMenu = null;
            _tkPrimary = null;
            _tkQuestTitle = null;
            _tkWalletPizza = null;
            _tkWalletBackpack = null;
        }

        private static bool TemplateKeyImpliesHard(string templateKey)
        {
            if (string.IsNullOrEmpty(templateKey))
                return false;
            if (string.Equals(templateKey, "hard", StringComparison.OrdinalIgnoreCase))
                return true;
            if (templateKey.EndsWith("-hard", StringComparison.OrdinalIgnoreCase))
                return true;
            if (templateKey.EndsWith("_hard", StringComparison.OrdinalIgnoreCase))
                return true;
            if (templateKey.StartsWith("hard_", StringComparison.OrdinalIgnoreCase))
                return true;
            return false;
        }

        private static bool TryGetHardFromContentJsonRoot(string contentJson)
        {
            if (string.IsNullOrWhiteSpace(contentJson))
                return false;
            var trimmed = contentJson.TrimStart();
            if (trimmed.Length == 0 || trimmed[0] != '{')
                return false;

            var probe = JsonUtility.FromJson<TaskContentDifficultyProbe>(contentJson);
            return probe != null &&
                   string.Equals(probe.difficulty, "hard", StringComparison.OrdinalIgnoreCase);
        }

        private static bool ShouldUseHardTaskChrome(GameQuestStepDto step)
        {
            if (step == null || !step.isTask)
                return false;
            if (!string.IsNullOrEmpty(step.difficulty) &&
                string.Equals(step.difficulty, "hard", StringComparison.OrdinalIgnoreCase))
                return true;
            if (TemplateKeyImpliesHard(step.templateKey))
                return true;
            return TryGetHardFromContentJsonRoot(step.contentJson);
        }

        [Serializable]
        private sealed class TaskContentDifficultyProbe
        {
            public string difficulty;
        }
    }
}
