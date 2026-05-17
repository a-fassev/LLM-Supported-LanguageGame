using System.Collections;
using LanguageGame.Application;
using LanguageGame.Presentation.Steps;
using UnityEngine;
using UnityEngine.Serialization;
using UnityEngine.UI;

namespace LanguageGame.Presentation
{
    public class QuestShellView : MonoBehaviour
    {
        private const string FinishQuestLabel = "Finish quest";
        private const string ShellCutsceneNextLabel = "Next";
        private const string BackToChaptersLabel = "Back to chapters";
        private const string ShellTaskCheckLabel = "Check";
        private const string RewardOverlayBackLabel = "Back";
        private const string ValidationDismissLabel = "OK";

        [FormerlySerializedAs("cityMapButton")] [SerializeField] private Button backToChaptersButton;
        [SerializeField] private Button nextTaskButton;
        [SerializeField] private Text   questTitleText;
        [SerializeField] private Text   taskDetailText;
        [SerializeField] private Text   pizzaSlicesText;
        [SerializeField] private Text   backpackPiecesText;
        [SerializeField] private Transform stepHost;
        [SerializeField] private StepTemplateCatalog stepTemplateCatalog;

        private GameObject           _backConfirmRoot;
        private Font                 _uiFont;
        private GameProgressApiClient _gameApi;
        private readonly LoadingOverlayPresenter _loadingOverlay = new LoadingOverlayPresenter();
        private string _pendingFinishRunId;
        private bool _submitting;
        private GameObject _activeStepObject;
        private IStepView _activeStepView;
        private GameQuestStepDto _boundStep;
        private GameObject _rewardOverlayRoot;
        private Text _rewardOverlayMessage;
        private Text _rewardOverlayPizza;
        private Text _rewardOverlayBackpack;
        private Button _rewardOverlayBackButton;
        private Button _rewardOverlayNextButton;
        private bool _rewardOverlayValidationMode;
        private bool _hasPendingAdvance;
        private int _pendingStepOrderIndex;
        private int _pendingTaskOrderIndex;
        private int _pendingTotalSlices;
        private int _pendingTotalBackpackPieces;
        private bool _pendingQuestComplete;
        private string _pendingRunId;

        private void Awake()
        {
            if (backToChaptersButton == null)
                Debug.LogWarning("[QuestShellView] backToChaptersButton is not assigned.");
            if (nextTaskButton == null)
                Debug.LogWarning("[QuestShellView] nextTaskButton is not assigned.");

            _uiFont  = questTitleText != null ? questTitleText.font : taskDetailText?.font;
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            if (_gameApi == null)
                Debug.LogWarning("[QuestShellView] GameProgressApiClient missing; online progression unavailable.");
            if (stepTemplateCatalog == null)
                stepTemplateCatalog = Resources.Load<StepTemplateCatalog>("Steps/StepTemplateCatalog_Default");
            if (stepHost == null && taskDetailText != null)
                stepHost = taskDetailText.transform.parent;
            if (taskDetailText != null)
                taskDetailText.raycastTarget = false;
            ResolveStepMountParent();
        }

        private void Start()
        {
            var flow = GameFlowController.Instance;
            if (flow != null)
                ChapterThemeRuntime.Apply(flow.SelectedChapterThemeJson);

            backToChaptersButton?.onClick.AddListener(OnBackToChaptersClicked);
            nextTaskButton?.onClick.AddListener(OnPrimaryChromeClicked);
            EnsureBackConfirmOverlay();
            EnsureRewardOverlay();
            RefreshStepUi();
        }

        private void RefreshStepUi()
        {
            UpdateWalletLabels();

            var flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[QuestShellView] GameFlowController not found.");
                return;
            }

            SetButtonLabel(backToChaptersButton, BackToChaptersLabel);

            if (!flow.IsServerQuestActive)
                return;

            if (!string.IsNullOrEmpty(_pendingFinishRunId))
            {
                if (questTitleText != null)
                    questTitleText.text = string.IsNullOrEmpty(flow.ServerQuestDisplayName) ? "Finishing quest" : flow.ServerQuestDisplayName;
                if (taskDetailText != null)
                {
                    taskDetailText.gameObject.SetActive(true);
                    taskDetailText.text = "Quest complete. Tap Finish quest to retry saving your completion.";
                }
                if (backToChaptersButton != null)
                    backToChaptersButton.gameObject.SetActive(true);
                if (nextTaskButton != null)
                    nextTaskButton.gameObject.SetActive(true);
                SetButtonLabel(nextTaskButton, FinishQuestLabel);
                if (nextTaskButton != null)
                    nextTaskButton.interactable = !_submitting && _gameApi != null;
                return;
            }

            if (!flow.TryGetCurrentServerStep(out var step))
            {
                if (questTitleText != null)
                    questTitleText.text = string.IsNullOrEmpty(flow.ServerQuestDisplayName) ? "Quest complete" : flow.ServerQuestDisplayName;
                if (taskDetailText != null)
                {
                    taskDetailText.gameObject.SetActive(true);
                    taskDetailText.text = string.Empty;
                }
                if (backToChaptersButton != null)
                    backToChaptersButton.gameObject.SetActive(true);
                if (nextTaskButton != null)
                    nextTaskButton.gameObject.SetActive(true);
                SetButtonLabel(nextTaskButton, FinishQuestLabel);
                if (nextTaskButton != null)
                    nextTaskButton.interactable = false;
                TeardownBoundStep();
                return;
            }

            if (questTitleText != null)
                questTitleText.text =
                    $"{flow.ServerQuestDisplayName} — Step {flow.ServerCurrentStepNumberOneBased}/{flow.ServerStepCount}";

            if (taskDetailText != null)
            {
                // Full-width placeholder sits in the task/cutscene band; hide it while a step view owns that area.
                taskDetailText.gameObject.SetActive(false);
            }

            BindStep(step, flow);
            ConfigureShellPrimaryChrome(step);
        }

        private void BindStep(GameQuestStepDto step, GameFlowController flow)
        {
            if (_boundStep != null && _boundStep.id == step.id)
                return;

            TeardownBoundStep();

            var host = stepHost != null ? stepHost : transform;
            GameObject instance = null;
            if (stepTemplateCatalog != null &&
                stepTemplateCatalog.TryResolve(step.templateKey, step.taskType, out var prefab) &&
                prefab != null)
            {
                instance = Instantiate(prefab, host, false);
            }
            else
            {
                Debug.LogWarning(
                    $"[QuestShellView] No step prefab in catalog for templateKey='{step.templateKey}' taskType='{step.taskType}'. " +
                    "Using an empty RectTransform; task UIs may fall back to runtime-generated controls. " +
                    $"Check `Resources/Steps/StepTemplateCatalog_Default` and prefab GUIDs under `Assets/Prefabs/Steps/`.");
                instance = new GameObject($"RuntimeStep_{step.orderIndex}", typeof(RectTransform));
                instance.transform.SetParent(host, false);
                if (step.isTask)
                    AddTaskViewComponent(instance, step.taskType);
                else
                    instance.AddComponent<CutsceneStepBase>();
            }

            var view = instance.GetComponent<IStepView>();
            if (view == null)
            {
                if (step.isTask)
                    AddTaskViewComponent(instance, step.taskType);
                else
                    instance.AddComponent<CutsceneStepBase>();
                view = instance.GetComponent<IStepView>();
            }

            if (taskDetailText != null)
                instance.transform.SetSiblingIndex(taskDetailText.transform.GetSiblingIndex() + 1);

            _activeStepObject = instance;
            _activeStepView = view;
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

        /// <summary>
        /// Steps are parented directly to the task panel (full <see cref="RectTransform"/> rect) so every child
        /// anchor/pivot matches Prefab Stage authoring for the same panel. Shell next/back remain later siblings
        /// on that panel and still draw on top when visible; see <see cref="BindStep"/> for sibling index.
        /// </summary>
        private void ResolveStepMountParent()
        {
            if (taskDetailText == null)
                return;

            var panel = taskDetailText.transform.parent;
            if (panel != null)
                stepHost = panel;
        }

        private static void AddTaskViewComponent(GameObject go, string taskType)
        {
            switch (taskType)
            {
                case "DragDrop":
                    go.AddComponent<DragDropStepView>();
                    break;
                case "ClozeText":
                    go.AddComponent<ClozeTextStepView>();
                    break;
                case "Matching":
                    go.AddComponent<MatchingStepView>();
                    break;
                case "MultipleChoice":
                    go.AddComponent<MultipleChoiceStepView>();
                    break;
                case "FreeText":
                    go.AddComponent<FreeTextStepView>();
                    break;
                case "RelativeClause":
                    go.AddComponent<RelativeClauseStepView>();
                    break;
                default:
                    go.AddComponent<ErrorSpottingStepView>();
                    break;
            }
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

            // Cutscene progression is server-backed (advances DB run index — avoids task "Step mismatch")
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
                return;
            }

            OnStepRequest(new StepCompletionRequest { requestComplete = true });
        }

        /// <summary>
        /// Shell owns Back + primary action for all steps: Check (task), Next (cutscene / finish).
        /// </summary>
        private void ConfigureShellPrimaryChrome(GameQuestStepDto step)
        {
            if (step == null)
                return;

            if (step.isTask)
            {
                if (backToChaptersButton != null)
                    backToChaptersButton.gameObject.SetActive(true);
                if (nextTaskButton != null)
                {
                    nextTaskButton.gameObject.SetActive(true);
                    SetButtonLabel(nextTaskButton, ShellTaskCheckLabel);
                    nextTaskButton.interactable = !_submitting && _gameApi != null;
                }

                return;
            }

            if (backToChaptersButton != null)
                backToChaptersButton.gameObject.SetActive(true);

            if (nextTaskButton != null)
            {
                nextTaskButton.gameObject.SetActive(true);
                SetButtonLabel(nextTaskButton, ShellCutsceneNextLabel);
                nextTaskButton.interactable = !_submitting && _gameApi != null;
            }
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

            var overlayReady = EnsureLoadingOverlay();
            if (overlayReady)
                _loadingOverlay.Show("Checking...");

            var runId = flow.ServerRunId;
            var useCase = new CompleteTaskUseCase(_gameApi);
            GameCompleteTaskEnvelope done = null;
            var err = string.Empty;
            yield return useCase.Run(runId, taskStepId, d => done = d, m => err = m);

            if (overlayReady)
                _loadingOverlay.Hide();

            if (done == null || !done.ok)
            {
                _submitting = false;
                Debug.LogWarning($"[QuestShellView] Complete task failed: {err}");
                _activeStepView?.SetInteractable(true);
                RefreshStepUi();
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
            // Server totals are authoritative; apply now so the HUD matches the overlay instead of waiting for "Next".
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

            var overlayReady = EnsureLoadingOverlay();
            if (overlayReady)
                _loadingOverlay.Show("Saving...");

            var runId = flow.ServerRunId;
            var useCase = new AdvanceCutsceneUseCase(_gameApi);
            GameCompleteTaskEnvelope done = null;
            var err = string.Empty;
            yield return useCase.Run(runId, cutsceneStepId, d => done = d, m => err = m);

            if (overlayReady)
                _loadingOverlay.Hide();

            _submitting = false;

            if (done == null || !done.ok)
            {
                Debug.LogWarning($"[QuestShellView] Cutscene advance failed: {err}");
                _activeStepView?.SetInteractable(true);
                RefreshStepUi();
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

            _submitting = true;
            _activeStepView?.SetInteractable(false);
            RefreshStepUi();

            var overlayReady = EnsureLoadingOverlay();
            if (overlayReady)
                _loadingOverlay.Show("Returning to chapters...");
            else
                Debug.LogWarning("[QuestShellView] Quest-exit overlay unavailable; using inline loading state.");

            var finish = new FinishQuestRunUseCase(_gameApi);
            GameFinishEnvelope finishResult = null;
            var finishErr = string.Empty;
            yield return finish.Run(runId, r => finishResult = r, e => finishErr = e);

            _loadingOverlay.Hide();

            if (finishResult == null || !finishResult.ok)
            {
                _submitting = false;
                var message = string.IsNullOrEmpty(finishErr)
                    ? "Could not save quest completion. Tap Finish quest to retry."
                    : $"Could not save quest completion: {finishErr}";
                Debug.LogWarning("[QuestShellView] " + message);
                if (taskDetailText != null)
                    taskDetailText.text = message;
                SetButtonLabel(nextTaskButton, FinishQuestLabel);
                if (nextTaskButton != null)
                    nextTaskButton.interactable = true;
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
        }

        private void OnBackConfirmCancel() => SetBackConfirmVisible(false);

        private void OnBackConfirmLeave()
        {
            SetBackConfirmVisible(false);
            GameFlowController.Instance?.LoadChapterOverview();
        }

        private void SetBackConfirmVisible(bool visible)
        {
            if (_backConfirmRoot != null)
                _backConfirmRoot.SetActive(visible);
        }

        private void EnsureBackConfirmOverlay()
        {
            if (_backConfirmRoot != null)
                return;

            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
            {
                Debug.LogError("[QuestShellView] No parent Canvas; cannot create back confirmation UI.");
                return;
            }

            UiThemeProvider.TryGet(out var t);

            // Colors
            var overlayColor  = t?.palette.overlay       ?? new Color(0f, 0f, 0f, 0.55f);
            var surfaceColor  = t?.palette.surface        ?? new Color(0.12f, 0.12f, 0.14f, 1f);
            var primaryColor  = t?.palette.primary        ?? new Color(0.2f, 0.55f, 0.85f, 1f);
            var textColor     = t?.palette.textPrimary    ?? Color.white;

            // Typography
            var font          = _uiFont != null ? _uiFont : UiTokenApplier.ResolveFont(t?.typography.body);
            var msgFontSize   = t?.typography.caption.fontSize ?? 22;
            var btnFontSize   = t?.typography.small.fontSize   ?? 18;

            // Layout
            var dlgW          = t?.layout.dialogWidth        ?? 520f;
            var dlgH          = t?.layout.dialogHeight       ?? 240f;
            var btnW          = t?.layout.dialogButtonWidth  ?? 160f;
            var btnH          = t?.layout.dialogButtonHeight ?? 44f;

            _backConfirmRoot = new GameObject("BackConfirmOverlay", typeof(RectTransform));
            _backConfirmRoot.transform.SetParent(canvas.transform, false);
            var rootRt = _backConfirmRoot.GetComponent<RectTransform>();
            rootRt.anchorMin = Vector2.zero;
            rootRt.anchorMax = Vector2.one;
            rootRt.offsetMin = Vector2.zero;
            rootRt.offsetMax = Vector2.zero;
            rootRt.SetAsLastSibling();

            var dim = _backConfirmRoot.AddComponent<Image>();
            dim.color = overlayColor;
            dim.raycastTarget = true;

            var panel = new GameObject("Panel", typeof(RectTransform));
            panel.transform.SetParent(_backConfirmRoot.transform, false);
            var panelRt = panel.GetComponent<RectTransform>();
            panelRt.anchorMin        = new Vector2(0.5f, 0.5f);
            panelRt.anchorMax        = new Vector2(0.5f, 0.5f);
            panelRt.pivot            = new Vector2(0.5f, 0.5f);
            panelRt.anchoredPosition = Vector2.zero;
            panelRt.sizeDelta        = new Vector2(dlgW, dlgH);

            var panelImg = panel.AddComponent<Image>();
            panelImg.color        = surfaceColor;
            panelImg.raycastTarget = true;

            var flow    = GameFlowController.Instance;
            var message = flow != null && flow.IsServerQuestActive
                ? "Progress is saved on the server after each step. You can resume this quest later from chapters. Leave now?"
                : "Leaving now will discard your progress on this quest. Do you want to go back to chapters?";

            var messageGo = new GameObject("Message", typeof(RectTransform));
            messageGo.transform.SetParent(panel.transform, false);
            var msgRt = messageGo.GetComponent<RectTransform>();
            msgRt.anchorMin = new Vector2(0.05f, 0.45f);
            msgRt.anchorMax = new Vector2(0.95f, 0.92f);
            msgRt.offsetMin = Vector2.zero;
            msgRt.offsetMax = Vector2.zero;
            var msgText = messageGo.AddComponent<Text>();
            msgText.font              = font;
            msgText.fontSize          = msgFontSize;
            msgText.color             = textColor;
            msgText.alignment         = TextAnchor.MiddleCenter;
            msgText.horizontalOverflow = HorizontalWrapMode.Wrap;
            msgText.verticalOverflow  = VerticalWrapMode.Truncate;
            msgText.text              = message;

            // Button positions are expressed as ±half-gap from the centre (relative to panel centre).
            var halfGap = dlgW * 0.23f;
            var btnY    = -(dlgH * 0.5f - btnH * 0.5f - (t?.spacing.m ?? 16f));

            var cancel = CreateDialogButton(panel.transform, "Stay",        new Vector2(-halfGap, btnY),
                primaryColor, textColor, font, btnFontSize);
            var ok     = CreateDialogButton(panel.transform, "Back to chapters", new Vector2(halfGap,  btnY),
                primaryColor, textColor, font, btnFontSize);

            cancel.GetComponent<RectTransform>().sizeDelta = new Vector2(btnW, btnH);
            ok.GetComponent<RectTransform>().sizeDelta     = new Vector2(btnW, btnH);

            cancel.onClick.AddListener(OnBackConfirmCancel);
            ok.onClick.AddListener(OnBackConfirmLeave);

            _backConfirmRoot.SetActive(false);
        }

        private bool EnsureLoadingOverlay()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
                canvas = FindAnyObjectByType<Canvas>();
            if (canvas == null)
            {
                Debug.LogError("[QuestShellView] No parent Canvas; cannot create loading overlay.");
                return false;
            }

            UiThemeProvider.TryGet(out var t);
            return _loadingOverlay.Ensure(canvas, t);
        }

        private void UpdateWalletLabels()
        {
            var flow     = GameFlowController.Instance;
            var slices   = flow != null ? flow.TotalPizzaSlices : 0;
            var backpack = flow != null ? flow.TotalBackpackPieces : 0;
            if (pizzaSlicesText != null)
                pizzaSlicesText.text = $"Pizza slices: {slices}";
            if (backpackPiecesText != null)
                backpackPiecesText.text = $"Backpack pieces: {backpack}";
        }

        private static Button CreateDialogButton(Transform parent, string label, Vector2 anchoredPos,
            Color bgColor, Color textColor, Font font, int fontSize)
        {
            var go = new GameObject(label + "Button", typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin        = new Vector2(0.5f, 0.5f);
            rt.anchorMax        = new Vector2(0.5f, 0.5f);
            rt.pivot            = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = anchoredPos;

            var img = go.AddComponent<Image>();
            img.color = bgColor;
            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;

            var textGo = new GameObject("Label", typeof(RectTransform));
            textGo.transform.SetParent(go.transform, false);
            var trt = textGo.GetComponent<RectTransform>();
            UiTokenApplier.StretchFull(trt);
            var t = textGo.AddComponent<Text>();
            t.font      = font;
            t.fontSize  = fontSize;
            t.alignment = TextAnchor.MiddleCenter;
            t.color     = textColor;
            t.text      = label;
            return btn;
        }

        private static void SetButtonLabel(Button button, string text)
        {
            if (button == null) return;
            var t = button.GetComponentInChildren<Text>();
            if (t != null)
                t.text = text;
        }

        private void OnDestroy()
        {
            backToChaptersButton?.onClick.RemoveListener(OnBackToChaptersClicked);
            nextTaskButton?.onClick.RemoveListener(OnPrimaryChromeClicked);
            TeardownBoundStep();
            _loadingOverlay.Destroy();
        }

        private void EnsureRewardOverlay()
        {
            if (_rewardOverlayRoot != null)
                return;

            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
                return;

            var root = new GameObject("TaskRewardOverlay", typeof(RectTransform), typeof(Image));
            root.transform.SetParent(canvas.transform, false);
            var rt = root.GetComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = root.GetComponent<Image>();
            img.color = new Color(0f, 0f, 0f, 0.55f);

            var panel = new GameObject("Panel", typeof(RectTransform), typeof(Image));
            panel.transform.SetParent(root.transform, false);
            var prt = panel.GetComponent<RectTransform>();
            prt.anchorMin = new Vector2(0.25f, 0.25f);
            prt.anchorMax = new Vector2(0.75f, 0.75f);
            prt.offsetMin = Vector2.zero;
            prt.offsetMax = Vector2.zero;
            panel.GetComponent<Image>().color = new Color(0.12f, 0.12f, 0.14f, 1f);

            var font = _uiFont != null ? _uiFont : UiTokenApplier.ResolveFallbackFont();

            var msg = CreateOverlayText(panel.transform, "Message", "Success!", new Vector2(0.1f, 0.72f), new Vector2(0.9f, 0.9f), 30, font);
            var pizza = CreateOverlayText(panel.transform, "Pizza", "Pizza slices gained: 0", new Vector2(0.1f, 0.52f), new Vector2(0.9f, 0.68f), 24, font);
            var backpack = CreateOverlayText(panel.transform, "Backpack", "Backpack pieces gained: 0", new Vector2(0.1f, 0.36f), new Vector2(0.9f, 0.5f), 24, font);

            var backBtn = CreateDialogButton(panel.transform, "Back", new Vector2(-120f, -110f), new Color(0.2f, 0.55f, 0.85f, 1f), Color.white, font, 22);
            var nextBtn = CreateDialogButton(panel.transform, "Next", new Vector2(120f, -110f), new Color(0.2f, 0.55f, 0.85f, 1f), Color.white, font, 22);
            backBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(180f, 48f);
            nextBtn.GetComponent<RectTransform>().sizeDelta = new Vector2(180f, 48f);

            backBtn.onClick.AddListener(OnRewardOverlayBack);
            nextBtn.onClick.AddListener(OnRewardOverlayNext);

            _rewardOverlayMessage = msg;
            _rewardOverlayPizza = pizza;
            _rewardOverlayBackpack = backpack;
            _rewardOverlayBackButton = backBtn;
            _rewardOverlayNextButton = nextBtn;

            _rewardOverlayRoot = root;
            _rewardOverlayRoot.SetActive(false);

            msg.name = "ResultMessageText";
            pizza.name = "ResultPizzaText";
            backpack.name = "ResultBackpackText";
        }

        private static Text CreateOverlayText(Transform parent, string name, string value, Vector2 anchorMin, Vector2 anchorMax, int size, Font font)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var text = go.GetComponent<Text>();
            text.font = font;
            text.fontSize = size;
            text.alignment = TextAnchor.MiddleCenter;
            text.color = Color.white;
            text.text = value;
            return text;
        }

        private void ShowRewardOverlay(int awardedSlices, int awardedBackpackPieces)
        {
            EnsureRewardOverlay();
            if (_rewardOverlayRoot == null)
                return;

            _rewardOverlayValidationMode = false;
            ConfigureRewardOverlaySuccessChrome();

            if (_rewardOverlayMessage != null)
                _rewardOverlayMessage.text = "Success!";
            if (_rewardOverlayPizza != null)
                _rewardOverlayPizza.text = $"Pizza slices gained: {Mathf.Max(0, awardedSlices)}";
            if (_rewardOverlayBackpack != null)
                _rewardOverlayBackpack.text = $"Backpack pieces gained: {Mathf.Max(0, awardedBackpackPieces)}";

            _activeStepView?.SetInteractable(false);
            SetRewardOverlayVisible(true);
        }

        private void PresentValidationMessage(string message)
        {
            if (string.IsNullOrEmpty(message))
                return;
            EnsureRewardOverlay();
            if (_rewardOverlayRoot == null)
                return;

            _rewardOverlayValidationMode = true;
            if (_rewardOverlayMessage != null)
                _rewardOverlayMessage.text = message;
            if (_rewardOverlayPizza != null)
                _rewardOverlayPizza.gameObject.SetActive(false);
            if (_rewardOverlayBackpack != null)
                _rewardOverlayBackpack.gameObject.SetActive(false);
            if (_rewardOverlayNextButton != null)
                _rewardOverlayNextButton.gameObject.SetActive(false);
            SetButtonLabel(_rewardOverlayBackButton, ValidationDismissLabel);

            SetRewardOverlayVisible(true);
        }

        private void ResetRewardOverlayToRewardLayout()
        {
            _rewardOverlayValidationMode = false;
            ConfigureRewardOverlaySuccessChrome();
        }

        private void ConfigureRewardOverlaySuccessChrome()
        {
            if (_rewardOverlayPizza != null)
                _rewardOverlayPizza.gameObject.SetActive(true);
            if (_rewardOverlayBackpack != null)
                _rewardOverlayBackpack.gameObject.SetActive(true);
            if (_rewardOverlayNextButton != null)
                _rewardOverlayNextButton.gameObject.SetActive(true);
            SetButtonLabel(_rewardOverlayBackButton, RewardOverlayBackLabel);
        }

        private void SetRewardOverlayVisible(bool visible)
        {
            if (_rewardOverlayRoot != null)
                _rewardOverlayRoot.SetActive(visible);
        }

        private void OnRewardOverlayBack()
        {
            if (_rewardOverlayValidationMode)
            {
                SetRewardOverlayVisible(false);
                _rewardOverlayValidationMode = false;
                ConfigureRewardOverlaySuccessChrome();
                return;
            }

            SetRewardOverlayVisible(false);
        }

        private void OnRewardOverlayNext()
        {
            if (_rewardOverlayValidationMode)
                return;

            SetRewardOverlayVisible(false);
            ApplyPendingAdvanceAndContinue();
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
            if (_activeStepObject != null)
            {
                Destroy(_activeStepObject);
                _activeStepObject = null;
            }
        }
    }
}
