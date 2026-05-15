using System.Collections;
using LanguageGame.Application;
using LanguageGame.Domain;
using UnityEngine;
using UnityEngine.UI;

namespace LanguageGame.Presentation
{
    public class LevelShellView : MonoBehaviour
    {
        private const string NextTaskLabel    = "Next task";
        private const string FinishLevelLabel = "Finish level";
        private const string BackToMapLabel   = "Back to map";

        [SerializeField] private Button cityMapButton;
        [SerializeField] private Button nextTaskButton;
        [SerializeField] private Text   levelTitleText;
        [SerializeField] private Text   taskDetailText;
        [SerializeField] private Text   pizzaSlicesText;

        private GameObject           _backConfirmRoot;
        private Font                 _uiFont;
        private bool                 _completingTask;
        private GameProgressApiClient _gameApi;

        private void Awake()
        {
            if (cityMapButton == null)
                Debug.LogWarning("[LevelShellView] cityMapButton is not assigned.");
            if (nextTaskButton == null)
                Debug.LogWarning("[LevelShellView] nextTaskButton is not assigned.");

            _uiFont  = levelTitleText != null ? levelTitleText.font : taskDetailText?.font;
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            if (_gameApi == null)
                Debug.LogWarning("[LevelShellView] GameProgressApiClient missing; online progression unavailable.");
        }

        private void Start()
        {
            cityMapButton?.onClick.AddListener(OnCityMapClicked);
            nextTaskButton?.onClick.AddListener(OnNextTaskClicked);
            EnsureBackConfirmOverlay();
            RefreshTaskUi();
        }

        private void RefreshTaskUi()
        {
            UpdatePizzaLabel();

            var flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[LevelShellView] GameFlowController not found.");
                return;
            }

            SetButtonLabel(cityMapButton, BackToMapLabel);

            if (flow.IsServerLevelActive)
            {
                RefreshServerTaskUi(flow);
                return;
            }

            if (!flow.TryGetCurrentTask(out var slot))
            {
                if (levelTitleText != null)
                    levelTitleText.text = "No active level";
                if (taskDetailText != null)
                    taskDetailText.text = string.Empty;
                SetButtonLabel(nextTaskButton, NextTaskLabel);
                nextTaskButton.interactable = true;
                return;
            }

            bool isLastTask = flow.ActiveLevelTaskCount > 0 &&
                              flow.CurrentTaskNumberOneBased == flow.ActiveLevelTaskCount;
            SetButtonLabel(nextTaskButton, isLastTask ? FinishLevelLabel : NextTaskLabel);

            if (levelTitleText != null)
                levelTitleText.text =
                    $"{flow.ActiveLevelDisplayName} — Task {flow.CurrentTaskNumberOneBased}/{flow.ActiveLevelTaskCount}";

            if (taskDetailText != null)
            {
                var label = string.IsNullOrEmpty(slot.placeholderLabel) ? "(placeholder)" : slot.placeholderLabel;
                taskDetailText.text = $"Type: {slot.taskType}\n{label}";
            }

            nextTaskButton.interactable = !_completingTask;
        }

        private void RefreshServerTaskUi(GameFlowController flow)
        {
            if (!flow.TryGetCurrentServerTask(out var task))
            {
                if (levelTitleText != null)
                    levelTitleText.text = string.IsNullOrEmpty(flow.ServerLevelDisplayName)
                        ? "Level complete"
                        : flow.ServerLevelDisplayName;
                if (taskDetailText != null)
                    taskDetailText.text = string.Empty;
                SetButtonLabel(nextTaskButton, FinishLevelLabel);
                nextTaskButton.interactable = false;
                return;
            }

            bool isLast = flow.ServerTaskCount > 0 &&
                          flow.ServerCurrentTaskNumberOneBased == flow.ServerTaskCount;
            SetButtonLabel(nextTaskButton, isLast ? FinishLevelLabel : NextTaskLabel);

            if (levelTitleText != null)
                levelTitleText.text =
                    $"{flow.ServerLevelDisplayName} — Task {flow.ServerCurrentTaskNumberOneBased}/{flow.ServerTaskCount}";

            if (taskDetailText != null)
            {
                var typeLabel = FormatTaskType(task.taskType);
                var label     = string.IsNullOrEmpty(task.placeholderLabel) ? "(placeholder)" : task.placeholderLabel;
                taskDetailText.text = $"Type: {typeLabel}\n{label}";
            }

            nextTaskButton.interactable = !_completingTask && _gameApi != null;
        }

        private static string FormatTaskType(string serverType)
        {
            if (string.IsNullOrEmpty(serverType)) return "?";
            return System.Enum.TryParse<TaskType>(serverType, out var t) ? t.ToString() : serverType;
        }

        private void OnNextTaskClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[LevelShellView] GameFlowController not found.");
                return;
            }

            if (GameFlowController.Instance.IsServerLevelActive)
            {
                if (_gameApi == null || _completingTask)
                    return;
                StartCoroutine(CompleteServerTaskRoutine());
                return;
            }

            if (GameFlowController.Instance.AdvanceTask())
                GameFlowController.Instance.LoadCityMap();
            else
                RefreshTaskUi();
        }

        private IEnumerator CompleteServerTaskRoutine()
        {
            var flow = GameFlowController.Instance;
            if (flow == null || _gameApi == null || !flow.TryGetCurrentServerTask(out var task))
                yield break;

            _completingTask = true;
            RefreshTaskUi();

            var runId    = flow.ServerRunId;
            var useCase  = new CompleteTaskUseCase(_gameApi);
            GameCompleteTaskEnvelope done = null;
            var err = string.Empty;
            yield return useCase.Run(runId, task.id, d => done = d, m => err = m);

            _completingTask = false;

            if (done == null || !done.ok)
            {
                Debug.LogWarning($"[LevelShellView] Complete task failed: {err}");
                RefreshTaskUi();
                yield break;
            }

            flow.SetTotalPizzaSlices(done.totalSlices);
            flow.ApplyServerTaskProgress(done.currentTaskOrderIndex, done.totalSlices, done.levelComplete);

            if (done.levelComplete)
            {
                var finish = new FinishLevelRunUseCase(_gameApi);
                yield return finish.Run(runId, _ => { }, _ => { });
                flow.LoadCityMap();
                yield break;
            }

            RefreshTaskUi();
        }

        private void OnCityMapClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[LevelShellView] GameFlowController not found.");
                return;
            }

            var flow = GameFlowController.Instance;
            if (flow.IsServerLevelActive)
            {
                if (flow.TryGetCurrentServerTask(out _))
                {
                    SetBackConfirmVisible(true);
                    return;
                }
                flow.LoadCityMap();
                return;
            }

            if (!flow.TryGetCurrentTask(out _))
            {
                GameFlowController.Instance.LoadCityMap();
                return;
            }

            SetBackConfirmVisible(true);
        }

        private void OnBackConfirmCancel() => SetBackConfirmVisible(false);

        private void OnBackConfirmLeave()
        {
            SetBackConfirmVisible(false);
            GameFlowController.Instance?.LoadCityMap();
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
                Debug.LogError("[LevelShellView] No parent Canvas; cannot create back confirmation UI.");
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
            var message = flow != null && flow.IsServerLevelActive
                ? "Progress is saved after each task. You can resume this level later from the map. Leave now?"
                : "Leaving now will discard your progress on this level. Do you want to go back to the map?";

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
            var ok     = CreateDialogButton(panel.transform, "Back to map", new Vector2(halfGap,  btnY),
                primaryColor, textColor, font, btnFontSize);

            cancel.GetComponent<RectTransform>().sizeDelta = new Vector2(btnW, btnH);
            ok.GetComponent<RectTransform>().sizeDelta     = new Vector2(btnW, btnH);

            cancel.onClick.AddListener(OnBackConfirmCancel);
            ok.onClick.AddListener(OnBackConfirmLeave);

            _backConfirmRoot.SetActive(false);
        }

        private void UpdatePizzaLabel()
        {
            var flow   = GameFlowController.Instance;
            var slices = flow != null ? flow.TotalPizzaSlices : 0;
            if (pizzaSlicesText != null)
                pizzaSlicesText.text = $"Pizza slices: {slices}";
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
            cityMapButton?.onClick.RemoveListener(OnCityMapClicked);
            nextTaskButton?.onClick.RemoveListener(OnNextTaskClicked);
        }
    }
}
