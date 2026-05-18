using System;
using System.Collections;
using LanguageGame.Application;
using LanguageGame.Presentation.Steps;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Quest runtime shell — UI Toolkit only (QuestShellScreen UXML asset under Resources + overlays).
    /// </summary>
    public class QuestShellView : MonoBehaviour
    {
        private const string FinishQuestLabel = "Finish quest";
        private const string ShellCutsceneNextLabel = "Next";
        private const string BackToChaptersLabel = "Back to chapters";
        private const string ShellTaskCheckLabel = "Controlla";
        private const string ValidationDismissLabel = "OK";

        private GameProgressApiClient _gameApi;
        private string _pendingFinishRunId;
        private bool _submitting;
        private IStepView _activeStepView;
        private GameQuestStepDto _boundStep;
        private bool _rewardOverlayValidationMode;
        private bool _hasPendingAdvance;
        private int _pendingStepOrderIndex;
        private int _pendingTaskOrderIndex;
        private int _pendingTotalSlices;
        private int _pendingTotalBackpackPieces;
        private bool _pendingQuestComplete;
        private string _pendingRunId;

        private UIDocument _toolkitDoc;
        private bool _shellReady;
        private VisualElement _toolkitStepHost;
        private VisualElement _questStepPanel;
        private Button _tkBackToChapters;
        private Button _tkPrimary;
        private Label _tkQuestTitle;
        private Label _tkWalletPizza;
        private Label _tkWalletBackpack;
        private readonly LearningToolkitLoadingOverlay _tkLoading = new();
        private readonly LearningToolkitConfirmModal _tkBackConfirm = new();
        private readonly LearningToolkitRewardModal _tkReward = new();
        private readonly LearningToolkitLoadErrorBanner _tkFinishError = new();

        private void Awake()
        {
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            if (_gameApi == null)
                Debug.LogWarning("[QuestShellView] GameProgressApiClient missing; online progression unavailable.");

            TrySpawnToolkitShell();
            if (!_shellReady)
            {
                Debug.LogError("[QuestShellView] Quest shell requires UI Toolkit bootstrap; disabling behaviour.");
                enabled = false;
            }
        }

        private void TrySpawnToolkitShell()
        {
            _toolkitDoc = LearningToolkitBootstrap.SpawnUiDocument(this, "QuestShellScreen");
            if (_toolkitDoc == null)
                return;

            var root = _toolkitDoc.rootVisualElement;
            _tkBackToChapters = root.Q<Button>("back-to-chapters-button");
            _tkPrimary = root.Q<Button>("primary-action-button");
            _tkQuestTitle = root.Q<Label>("quest-title-label");
            _tkWalletPizza = root.Q<Label>("wallet-pizza");
            _tkWalletBackpack = root.Q<Label>("wallet-backpack");
            _toolkitStepHost = root.Q<VisualElement>("step-host");
            _questStepPanel = root.Q<VisualElement>("quest-step-panel");

            if (_tkBackToChapters == null || _tkPrimary == null || _toolkitStepHost == null)
            {
                Debug.LogError("[QuestShellView] QuestShellScreen UXML missing required elements (back, primary, step-host).");
                Destroy(_toolkitDoc.gameObject);
                _toolkitDoc = null;
                return;
            }

            var overlay = LearningToolkitBootstrap.ResolveOverlayPlane(_toolkitDoc);
            if (overlay == null)
            {
                Debug.LogError("[QuestShellView] QuestShellScreen UXML missing overlay-plane.");
                Destroy(_toolkitDoc.gameObject);
                _toolkitDoc = null;
                return;
            }

            _tkBackToChapters.RegisterCallback<ClickEvent>(_ => OnBackToChaptersClicked());
            _tkPrimary.RegisterCallback<ClickEvent>(_ => OnPrimaryChromeClicked());

            _tkLoading.Attach(overlay);
            _tkBackConfirm.Attach(overlay);
            _tkReward.Attach(overlay);
            _tkFinishError.Attach(overlay);

            LearningToolkitNavigationFeedback.RegisterPresentationDocument(_toolkitDoc);

            _shellReady = true;
        }

        private void Start()
        {
            var flow = GameFlowController.Instance;
            if (flow != null)
                ChapterThemeRuntime.Apply(flow.SelectedChapterThemeJson);

            RefreshStepUi();
        }

        private void ConfigureBackToChaptersButton(GameFlowController flow)
        {
            if (_tkBackToChapters == null)
                return;

            _tkBackToChapters.text = BackToChaptersLabel;
            var enabled = flow != null && !_submitting && !flow.IsSceneTransitionInProgress;
            _tkBackToChapters.SetEnabled(enabled);
        }

        private void RefreshStepUi()
        {
            if (!_shellReady)
                return;

            UpdateWalletLabels();

            var flow = GameFlowController.Instance;
            ConfigureBackToChaptersButton(flow);

            if (flow == null)
            {
                Debug.LogError("[QuestShellView] GameFlowController not found.");
                return;
            }

            if (!flow.IsServerQuestActive)
            {
                ClearQuestDifficultyChrome();
                return;
            }

            if (!string.IsNullOrEmpty(_pendingFinishRunId))
            {
                ClearQuestDifficultyChrome();
                var titleFinishing = string.IsNullOrEmpty(flow.ServerQuestDisplayName)
                    ? "Finishing quest"
                    : flow.ServerQuestDisplayName;
                if (_tkQuestTitle != null)
                    _tkQuestTitle.text = titleFinishing;

                if (_tkPrimary != null)
                {
                    _tkPrimary.text = FinishQuestLabel;
                    _tkPrimary.SetEnabled(!_submitting && _gameApi != null);
                    _tkPrimary.style.display = DisplayStyle.Flex;
                }

                return;
            }

            if (!flow.TryGetCurrentServerStep(out var step))
            {
                var titleDone = string.IsNullOrEmpty(flow.ServerQuestDisplayName)
                    ? "Quest complete"
                    : flow.ServerQuestDisplayName;
                if (_tkQuestTitle != null)
                    _tkQuestTitle.text = titleDone;
                if (_tkPrimary != null)
                {
                    _tkPrimary.text = FinishQuestLabel;
                    _tkPrimary.SetEnabled(false);
                    _tkPrimary.style.display = DisplayStyle.Flex;
                }

                TeardownBoundStep();
                return;
            }

            if (_tkQuestTitle != null)
                _tkQuestTitle.text =
                    $"{flow.ServerQuestDisplayName} — Step {flow.ServerCurrentStepNumberOneBased}/{flow.ServerStepCount}";

            BindStep(step, flow);
            ConfigureShellPrimaryChrome(step);
            ApplyQuestShellDifficultyChrome(step);
        }

        /// <summary>
        /// Skip rebinding only when the server step is unchanged for UI purposes (same id + payload + chrome inputs).
        /// </summary>
        private static bool SameStepBindingForUi(GameQuestStepDto cached, GameQuestStepDto incoming)
        {
            if (incoming == null || cached == null)
                return false;
            if (!string.Equals(cached.id, incoming.id, StringComparison.Ordinal))
                return false;
            return string.Equals(cached.contentJson ?? "", incoming.contentJson ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.difficulty ?? "", incoming.difficulty ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.templateKey ?? "", incoming.templateKey ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.rewardRulesJson ?? "", incoming.rewardRulesJson ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.stepKind ?? "", incoming.stepKind ?? "", StringComparison.Ordinal)
                   && string.Equals(cached.taskType ?? "", incoming.taskType ?? "", StringComparison.Ordinal)
                   && cached.isTask == incoming.isTask
                   && cached.orderIndex == incoming.orderIndex;
        }

        private void BindStep(GameQuestStepDto step, GameFlowController flow)
        {
            if (_boundStep != null && SameStepBindingForUi(_boundStep, step))
                return;

            TeardownBoundStep();

            _toolkitStepHost.Clear();
            _activeStepView = ToolkitStepFactory.Create(step, _toolkitStepHost, this);
            if (_activeStepView == null)
            {
                Debug.LogError(
                    $"[QuestShellView] ToolkitStepFactory returned null — step-host missing?. stepId={step.id} taskType={step.taskType}");
                _activeStepView = StubToolkitTaskStep.CreateMissingFactoryFallback(_toolkitStepHost, step);
            }

            _boundStep = step;

            _activeStepView.Bind(new StepContext
            {
                runId = flow.ServerRunId,
                stepId = step.id,
                taskId = step.id,
                questId = flow.ServerQuestId,
                questDisplayName = flow.ServerQuestDisplayName,
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
                presentValidationMessage = PresentValidationMessage,
                presentBusyOverlay = msg =>
                    _tkLoading.Show(string.IsNullOrWhiteSpace(msg) ? "Loading…" : msg),
                dismissBusyOverlay = () => _tkLoading.Hide(),
                gameProgressApi = _gameApi,
            }, OnStepRequest);
            _activeStepView.SetInteractable(!_submitting);

            ResetRewardOverlayToRewardLayout();
            SetRewardOverlayVisible(false);
        }

        private void OnStepRequest(StepCompletionRequest request)
        {
            if (request.requestBackToChapters)
            {
                OnBackToChaptersClicked();
                return;
            }

            if (!request.requestComplete)
                return;

            var flow = GameFlowController.Instance;
            if (flow == null)
                return;

            if (_boundStep == null)
                return;

            if (_boundStep.isTask)
            {
                if (_gameApi == null || _submitting || string.IsNullOrEmpty(_boundStep.id))
                    return;
                StartCoroutine(CompleteServerTaskRoutine(_boundStep.id, request.taskAttemptJson));
                return;
            }

            if (_gameApi == null || _submitting || string.IsNullOrEmpty(_boundStep.id))
                return;
            StartCoroutine(AdvanceCutsceneRoutine(_boundStep.id));
        }

        private void OnPrimaryChromeClicked()
        {
            if (!string.IsNullOrEmpty(_pendingFinishRunId))
            {
                if (!_submitting && _gameApi != null)
                    StartCoroutine(FinishPendingRunRoutine(_pendingFinishRunId));
                return;
            }

            if (_boundStep != null && _boundStep.isTask)
            {
                if (_activeStepView is ISubmitFromShell submit)
                    submit.SubmitFromShell();
                else if (_activeStepView != null)
                    Debug.LogWarning(
                        "[QuestShellView] Task step does not implement ISubmitFromShell; Controlla did nothing. " +
                        $"Step type: {_activeStepView.GetType().Name}");
                else
                    Debug.LogWarning("[QuestShellView] Task step Controlla pressed but no active step view.");
                return;
            }

            OnStepRequest(new StepCompletionRequest { requestComplete = true });
        }

        private void ConfigureShellPrimaryChrome(GameQuestStepDto step)
        {
            if (step == null || !_shellReady || _tkPrimary == null)
                return;

            if (step.isTask)
            {
                _tkPrimary.text = ShellTaskCheckLabel;
                _tkPrimary.SetEnabled(!_submitting && _gameApi != null);
                _tkPrimary.style.display = DisplayStyle.Flex;
                return;
            }

            _tkPrimary.text = ShellCutsceneNextLabel;
            _tkPrimary.SetEnabled(!_submitting && _gameApi != null);
            _tkPrimary.style.display = DisplayStyle.Flex;
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
            if (flow == null || _gameApi == null || string.IsNullOrEmpty(taskStepId))
                yield break;

            if (_boundStep == null ||
                !_boundStep.isTask ||
                !flow.TryGetCurrentServerStep(out var cur) ||
                cur?.id != taskStepId)
            {
                Debug.LogWarning("[QuestShellView] Task submit skipped — step mismatch with local progression; refreshing.");
                RefreshStepUi();
                yield break;
            }

            _submitting = true;
            _activeStepView?.SetInteractable(false);
            RefreshStepUi();

            _tkLoading.Show("Checking...");

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
                _tkLoading.Hide();
                _submitting = false;
                Debug.LogWarning("[QuestShellView] Scored pizza task submitted without attempt JSON; check step wiring.");
                PresentValidationMessage("Impossibile inviare il compito. Riprova.");
                _activeStepView?.SetInteractable(true);
                RefreshStepUi();
                yield break;
            }

            if (!serverScoredPizza || isFreitextLlm)
                taskAttemptJson = null;

            var useCase = new CompleteTaskUseCase(_gameApi);
            GameCompleteTaskEnvelope done = null;
            var err = string.Empty;
            yield return useCase.Run(runId, taskStepId, d => done = d, m => err = m, evaluationGateToken,
                taskAttemptJson);

            _tkLoading.Hide();

            if (done == null || !done.ok)
            {
                _submitting = false;
                Debug.LogWarning($"[QuestShellView] Complete task failed: {err}");
                if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                    GameFlowController.Instance?.LoadAuth();
                else
                {
                    _activeStepView?.SetInteractable(true);
                    RefreshStepUi();
                }

                yield break;
            }

            _submitting = false;
            _hasPendingAdvance = true;
            _pendingRunId = runId;
            _pendingStepOrderIndex = done.currentStepOrderIndex;
            _pendingTaskOrderIndex = done.currentTaskOrderIndex;
            _pendingTotalSlices = done.totalSlices;
            _pendingTotalBackpackPieces = done.totalBackpackPieces;
            _pendingQuestComplete = done.questComplete;
            flow.SetTotalPizzaSlices(done.totalSlices);
            flow.SetTotalBackpackPieces(done.totalBackpackPieces);
            UpdateWalletLabels();
            ShowRewardOverlay(done.awardedSlices, done.awardedBackpackPieces);
        }

        private IEnumerator AdvanceCutsceneRoutine(string cutsceneStepId)
        {
            var flow = GameFlowController.Instance;
            if (flow == null || _gameApi == null || string.IsNullOrEmpty(cutsceneStepId))
                yield break;

            if (_boundStep == null ||
                _boundStep.isTask ||
                !flow.TryGetCurrentServerStep(out var curC) ||
                curC?.id != cutsceneStepId)
            {
                Debug.LogWarning("[QuestShellView] Cutscene advance skipped — stale step binding; refreshing.");
                RefreshStepUi();
                yield break;
            }

            _submitting = true;
            _activeStepView?.SetInteractable(false);
            RefreshStepUi();

            _tkLoading.Show("Saving...");

            var runId = flow.ServerRunId;
            var useCase = new AdvanceCutsceneUseCase(_gameApi);
            GameCompleteTaskEnvelope done = null;
            var err = string.Empty;
            yield return useCase.Run(runId, cutsceneStepId, d => done = d, m => err = m);

            _tkLoading.Hide();

            _submitting = false;

            if (done == null || !done.ok)
            {
                Debug.LogWarning($"[QuestShellView] Cutscene advance failed: {err}");
                if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                    GameFlowController.Instance?.LoadAuth();
                else
                {
                    _activeStepView?.SetInteractable(true);
                    RefreshStepUi();
                }

                yield break;
            }

            flow.ApplyServerTaskProgress(done.currentStepOrderIndex, done.currentTaskOrderIndex, done.totalSlices,
                done.totalBackpackPieces, questComplete: false);

            if (done.questComplete)
            {
                _pendingFinishRunId = flow.ServerRunId;
                StartCoroutine(FinishPendingRunRoutine(_pendingFinishRunId));
                yield break;
            }

            RefreshStepUi();
        }

        private IEnumerator FinishPendingRunRoutine(string runId)
        {
            if (string.IsNullOrEmpty(runId) || _gameApi == null)
                yield break;

            _tkFinishError.Hide();
            _submitting = true;
            _activeStepView?.SetInteractable(false);
            RefreshStepUi();

            _tkLoading.Show("Returning to chapters...");

            var finish = new FinishQuestRunUseCase(_gameApi);
            GameFinishEnvelope finishResult = null;
            var finishErr = string.Empty;
            yield return finish.Run(runId, r => finishResult = r, e => finishErr = e);

            _tkLoading.Hide();

            if (finishResult == null || !finishResult.ok)
            {
                _submitting = false;
                if (GameProgressApiClient.LooksLikeSessionAuthFailure(finishErr))
                {
                    GameFlowController.Instance?.LoadAuth();
                    yield break;
                }

                var message = string.IsNullOrEmpty(finishErr)
                    ? "Could not save quest completion. Tap Finish quest to retry."
                    : $"Could not save quest completion: {finishErr}";
                Debug.LogWarning("[QuestShellView] " + message);

                _tkFinishError.Show(message, () =>
                {
                    _tkFinishError.Hide();
                    StartCoroutine(FinishPendingRunRoutine(runId));
                });

                if (_tkPrimary != null)
                {
                    _tkPrimary.text = FinishQuestLabel;
                    _tkPrimary.SetEnabled(true);
                    _tkPrimary.style.display = DisplayStyle.Flex;
                }

                yield break;
            }

            _pendingFinishRunId = null;
            _submitting = false;
            GameFlowController.Instance?.SetTotalPizzaSlices(finishResult.totalSlices);
            GameFlowController.Instance?.SetTotalBackpackPieces(finishResult.totalBackpackPieces);
            GameFlowController.Instance?.ClearServerQuestState();
            GameFlowController.Instance?.LoadQuestOverview();
        }

        private void OnBackToChaptersClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[QuestShellView] GameFlowController not found.");
                return;
            }

            var flow = GameFlowController.Instance;
            if (_submitting)
                return;

            if (flow.IsSceneTransitionInProgress)
                return;

            if (flow.IsServerQuestActive)
            {
                if (flow.TryGetCurrentServerStep(out _))
                {
                    SetBackConfirmVisible(true);
                    return;
                }

                flow.LoadChapterOverview();
                return;
            }

            // Recovery: Quest scene without an active server run (stale entry, failed load, etc.).
            flow.LoadChapterOverview();
        }

        private void OnBackConfirmCancel() => SetBackConfirmVisible(false);

        private void OnBackConfirmLeave()
        {
            SetBackConfirmVisible(false);
            GameFlowController.Instance?.LoadChapterOverview();
        }

        private void SetBackConfirmVisible(bool visible)
        {
            if (!_shellReady)
                return;

            if (visible)
            {
                var flow = GameFlowController.Instance;
                var message = flow != null && flow.IsServerQuestActive
                    ? "Progress is saved on the server after each step. You can resume this quest later from chapters. Leave now?"
                    : "Leaving now will discard your progress on this quest. Do you want to go back to chapters?";
                _tkBackConfirm.Show("Leave quest?", message, "Stay", "Back to chapters", OnBackConfirmCancel,
                    OnBackConfirmLeave);
            }
            else
                _tkBackConfirm.Hide();
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

        private void OnDestroy()
        {
            if (_toolkitDoc != null)
                LearningToolkitNavigationFeedback.UnregisterPresentationDocument(_toolkitDoc);
            TeardownBoundStep();
            _tkLoading.Destroy();
            _tkBackConfirm.Destroy();
            _tkReward.Destroy();
            _tkFinishError.Destroy();
            if (_toolkitDoc != null)
                Destroy(_toolkitDoc.gameObject);
        }

        private void ShowRewardOverlay(int awardedSlices, int awardedBackpackPieces)
        {
            _rewardOverlayValidationMode = false;
            _tkReward.ConfigureSuccessChrome();
            _tkReward.ShowSuccess(
                "Success!",
                $"Pizza slices gained: {Mathf.Max(0, awardedSlices)}",
                $"Backpack pieces gained: {Mathf.Max(0, awardedBackpackPieces)}",
                OnToolkitRewardBackDismiss,
                OnToolkitRewardNextDismiss);
            _activeStepView?.SetInteractable(false);
        }

        private void OnToolkitRewardBackDismiss()
        {
            if (_rewardOverlayValidationMode)
            {
                _tkReward.Hide();
                _rewardOverlayValidationMode = false;
                _tkReward.ConfigureSuccessChrome();
                return;
            }

            _tkReward.Hide();
        }

        private void OnToolkitRewardNextDismiss()
        {
            if (_rewardOverlayValidationMode)
                return;
            _tkReward.Hide();
            ApplyPendingAdvanceAndContinue();
        }

        private void PresentValidationMessage(string message)
        {
            if (string.IsNullOrEmpty(message))
                return;

            _rewardOverlayValidationMode = true;
            _tkReward.ShowValidation(message, ValidationDismissLabel, () =>
            {
                _tkReward.Hide();
                _rewardOverlayValidationMode = false;
                _tkReward.ConfigureSuccessChrome();
            });
        }

        private void ResetRewardOverlayToRewardLayout()
        {
            _rewardOverlayValidationMode = false;
            _tkReward.ConfigureSuccessChrome();
        }

        private void SetRewardOverlayVisible(bool visible)
        {
            if (!visible)
                _tkReward.Hide();
        }

        private void ApplyPendingAdvanceAndContinue()
        {
            if (!_hasPendingAdvance)
                return;

            var flow = GameFlowController.Instance;
            if (flow == null)
                return;

            _hasPendingAdvance = false;
            flow.ApplyServerTaskProgress(_pendingStepOrderIndex, _pendingTaskOrderIndex, _pendingTotalSlices,
                _pendingTotalBackpackPieces, questComplete: false);

            if (_pendingQuestComplete)
            {
                _pendingFinishRunId = _pendingRunId;
                StartCoroutine(FinishPendingRunRoutine(_pendingRunId));
                return;
            }

            RefreshStepUi();
        }

        private void TeardownBoundStep()
        {
            ClearQuestDifficultyChrome();
            _activeStepView?.Teardown();
            _activeStepView = null;
            _boundStep = null;
            if (_shellReady && _toolkitStepHost != null)
                _toolkitStepHost.Clear();
        }

        [Serializable]
        private sealed class TaskContentDifficultyProbe
        {
            public string difficulty;
        }

    }
}
