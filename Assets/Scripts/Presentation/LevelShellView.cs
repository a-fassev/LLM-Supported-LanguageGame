using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class LevelShellView : MonoBehaviour
    {
        private const string NextTaskLabel = "Next task";
        private const string FinishLevelLabel = "Finish level";
        private const string BackToMapLabel = "Back to map";

        [SerializeField] private Button cityMapButton;
        [SerializeField] private Button nextTaskButton;
        [SerializeField] private Text levelTitleText;
        [SerializeField] private Text taskDetailText;

        private GameObject _backConfirmRoot;
        private Font _uiFont;

        private void Awake()
        {
            if (cityMapButton == null)
                Debug.LogWarning("[LevelShellView] cityMapButton is not assigned.");
            if (nextTaskButton == null)
                Debug.LogWarning("[LevelShellView] nextTaskButton is not assigned.");

            _uiFont = levelTitleText != null ? levelTitleText.font : taskDetailText?.font;
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
            var flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[LevelShellView] GameFlowController not found.");
                return;
            }

            SetButtonLabel(cityMapButton, BackToMapLabel);

            if (!flow.TryGetCurrentTask(out var slot))
            {
                if (levelTitleText != null)
                    levelTitleText.text = "No active level";
                if (taskDetailText != null)
                    taskDetailText.text = string.Empty;
                SetButtonLabel(nextTaskButton, NextTaskLabel);
                return;
            }

            bool isLastTask = flow.ActiveLevelTaskCount > 0 &&
                              flow.CurrentTaskNumberOneBased == flow.ActiveLevelTaskCount;
            SetButtonLabel(nextTaskButton, isLastTask ? FinishLevelLabel : NextTaskLabel);

            if (levelTitleText != null)
            {
                levelTitleText.text =
                    $"{flow.ActiveLevelDisplayName} — Task {flow.CurrentTaskNumberOneBased}/{flow.ActiveLevelTaskCount}";
            }

            if (taskDetailText != null)
            {
                var label = string.IsNullOrEmpty(slot.placeholderLabel)
                    ? "(placeholder)"
                    : slot.placeholderLabel;
                taskDetailText.text = $"Type: {slot.taskType}\n{label}";
            }
        }

        private void OnNextTaskClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[LevelShellView] GameFlowController not found.");
                return;
            }

            if (GameFlowController.Instance.AdvanceTask())
                GameFlowController.Instance.LoadCityMap();
            else
                RefreshTaskUi();
        }

        private void OnCityMapClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[LevelShellView] GameFlowController not found.");
                return;
            }

            if (!GameFlowController.Instance.TryGetCurrentTask(out _))
            {
                GameFlowController.Instance.LoadCityMap();
                return;
            }

            SetBackConfirmVisible(true);
        }

        private void OnBackConfirmCancel()
        {
            SetBackConfirmVisible(false);
        }

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

            _backConfirmRoot = new GameObject("BackConfirmOverlay", typeof(RectTransform));
            _backConfirmRoot.transform.SetParent(canvas.transform, false);
            var rootRt = _backConfirmRoot.GetComponent<RectTransform>();
            rootRt.anchorMin = Vector2.zero;
            rootRt.anchorMax = Vector2.one;
            rootRt.offsetMin = Vector2.zero;
            rootRt.offsetMax = Vector2.zero;
            rootRt.SetAsLastSibling();

            var dim = _backConfirmRoot.AddComponent<Image>();
            dim.color = new Color(0f, 0f, 0f, 0.55f);
            dim.raycastTarget = true;

            var panel = new GameObject("Panel", typeof(RectTransform));
            panel.transform.SetParent(_backConfirmRoot.transform, false);
            var panelRt = panel.GetComponent<RectTransform>();
            panelRt.anchorMin = new Vector2(0.5f, 0.5f);
            panelRt.anchorMax = new Vector2(0.5f, 0.5f);
            panelRt.pivot = new Vector2(0.5f, 0.5f);
            panelRt.anchoredPosition = Vector2.zero;
            panelRt.sizeDelta = new Vector2(520f, 220f);

            var panelImg = panel.AddComponent<Image>();
            panelImg.color = new Color(0.12f, 0.12f, 0.14f, 1f);
            panelImg.raycastTarget = true;

            var messageGo = new GameObject("Message", typeof(RectTransform));
            messageGo.transform.SetParent(panel.transform, false);
            var msgRt = messageGo.GetComponent<RectTransform>();
            msgRt.anchorMin = new Vector2(0.05f, 0.45f);
            msgRt.anchorMax = new Vector2(0.95f, 0.92f);
            msgRt.offsetMin = Vector2.zero;
            msgRt.offsetMax = Vector2.zero;
            var msgText = messageGo.AddComponent<Text>();
            msgText.font = _uiFont;
            msgText.fontSize = 22;
            msgText.color = Color.white;
            msgText.alignment = TextAnchor.MiddleCenter;
            msgText.horizontalOverflow = HorizontalWrapMode.Wrap;
            msgText.verticalOverflow = VerticalWrapMode.Truncate;
            msgText.text =
                "Leaving now will discard your progress on this level. Do you want to go back to the map?";

            var cancel = CreateDialogButton(panel.transform, "Stay", new Vector2(-120f, -70f), OnBackConfirmCancel);
            var ok = CreateDialogButton(panel.transform, "Back to map", new Vector2(120f, -70f), OnBackConfirmLeave);

            cancel.GetComponent<RectTransform>().sizeDelta = new Vector2(160f, 44f);
            ok.GetComponent<RectTransform>().sizeDelta = new Vector2(160f, 44f);

            _backConfirmRoot.SetActive(false);
        }

        private Button CreateDialogButton(Transform parent, string label, Vector2 anchoredPos, UnityEngine.Events.UnityAction onClick)
        {
            var go = new GameObject(label + "Button", typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = anchoredPos;
            rt.sizeDelta = new Vector2(140f, 40f);

            var img = go.AddComponent<Image>();
            img.color = new Color(0.25f, 0.45f, 0.7f, 1f);
            var btn = go.AddComponent<Button>();
            btn.targetGraphic = img;
            btn.onClick.AddListener(onClick);

            var textGo = new GameObject("Label", typeof(RectTransform));
            textGo.transform.SetParent(go.transform, false);
            var trt = textGo.GetComponent<RectTransform>();
            trt.anchorMin = Vector2.zero;
            trt.anchorMax = Vector2.one;
            trt.offsetMin = Vector2.zero;
            trt.offsetMax = Vector2.zero;
            var t = textGo.AddComponent<Text>();
            t.font = _uiFont;
            t.fontSize = 18;
            t.alignment = TextAnchor.MiddleCenter;
            t.color = Color.white;
            t.text = label;
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
