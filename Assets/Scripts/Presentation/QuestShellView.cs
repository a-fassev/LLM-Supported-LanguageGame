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
        private const string ShellTaskCheckLabel = "Check";
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
                return;

            if (!string.IsNullOrEmpty(_pendingFinishRunId))
            {
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
        }

        private void BindStep(GameQuestStepDto step, GameFlowController flow)
        {
            if (_boundStep != null && _boundStep.id == step.id)
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
                StartCoroutine(CompleteServerTaskRoutine(_boundStep.id));
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
                        "[QuestShellView] Task step does not implement ISubmitFromShell; Check did nothing. " +
                        $"Step type: {_activeStepView.GetType().Name}");
                else
                    Debug.LogWarning("[QuestShellView] Task step Check pressed but no active step view.");
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

        private IEnumerator CompleteServerTaskRoutine(string taskStepId)
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
            var useCase = new CompleteTaskUseCase(_gameApi);
            GameCompleteTaskEnvelope done = null;
            var err = string.Empty;
            yield return useCase.Run(runId, taskStepId, d => done = d, m => err = m);

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
            var flow = GameFlowController.Instance;
            var slices = flow != null ? flow.TotalPizzaSlices : 0;
            var backpack = flow != null ? flow.TotalBackpackPieces : 0;

            if (_tkWalletPizza != null)
                _tkWalletPizza.text = slices.ToString();
            if (_tkWalletBackpack != null)
                _tkWalletBackpack.text = backpack.ToString();
        }

        private void OnDestroy()
        {
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
            _activeStepView?.Teardown();
            _activeStepView = null;
            _boundStep = null;
            if (_shellReady && _toolkitStepHost != null)
                _toolkitStepHost.Clear();
        }

    }
}
