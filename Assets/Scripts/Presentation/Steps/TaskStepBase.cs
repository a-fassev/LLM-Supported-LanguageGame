using System;
using UnityEngine;
using UnityEngine.UI;

namespace LanguageGame.Presentation.Steps
{
    public class TaskStepBase : MonoBehaviour, IStepView
    {
        [SerializeField] private Text titleText;
        [SerializeField] private Text bodyText;
        [SerializeField] private Button checkButton;
        [SerializeField] private Button backToChaptersButton;
        [SerializeField] private GameObject resultOverlayRoot;
        [SerializeField] private Text resultMessageText;
        [SerializeField] private Text resultPizzaText;
        [SerializeField] private Text resultBackpackText;
        [SerializeField] private Button resultBackButton;
        [SerializeField] private Button resultNextButton;

        private Action<StepCompletionRequest> _onRequest;
        private StepContext _context;
        private bool _clickListenersAttached;

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context ?? new StepContext();
            _onRequest = onRequest;

            EnsureRuntimeFallback();
            ApplyHostedBackNavigation();
            AttachClickListenersOnce();

            var kind = context?.taskType;
            if (titleText != null)
                titleText.text = string.IsNullOrEmpty(kind) ? "Task" : kind;
            if (bodyText != null)
                bodyText.text = string.IsNullOrEmpty(context?.contentJson)
                    ? "(task placeholder)"
                    : context.contentJson;
            SetOverlayVisible(false);
        }

        public void SetInteractable(bool interactable)
        {
            if (checkButton != null)
                checkButton.interactable = interactable;
            if (backToChaptersButton != null && backToChaptersButton.gameObject.activeSelf)
                backToChaptersButton.interactable = interactable;
            if (resultBackButton != null)
                resultBackButton.interactable = interactable;
            if (resultNextButton != null)
                resultNextButton.interactable = interactable;
        }

        public void Teardown()
        {
            _onRequest = null;
            _context = null;
        }

        private void OnCheckClicked()
        {
            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        private void OnBackToChaptersClicked()
        {
            _onRequest?.Invoke(new StepCompletionRequest { requestBackToChapters = true });
        }

        private void OnResultBackClicked()
        {
            SetOverlayVisible(false);
        }

        private void OnResultNextClicked()
        {
            SetOverlayVisible(false);
            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        private void SetOverlayVisible(bool visible)
        {
            if (resultOverlayRoot != null)
                resultOverlayRoot.SetActive(visible);
        }

        private void ApplyHostedBackNavigation()
        {
            var suppress = _context != null && _context.suppressHostedBackChapterNavigation;
            if (backToChaptersButton == null)
                return;
            backToChaptersButton.gameObject.SetActive(!suppress);
            if (!suppress)
                return;
            backToChaptersButton.interactable = false;
            backToChaptersButton.onClick.RemoveListener(OnBackToChaptersClicked);
        }

        private void AttachClickListenersOnce()
        {
            if (_clickListenersAttached)
                return;
            _clickListenersAttached = true;

            if (checkButton != null)
                checkButton.onClick.AddListener(OnCheckClicked);
            if (backToChaptersButton != null && backToChaptersButton.gameObject.activeSelf)
                backToChaptersButton.onClick.AddListener(OnBackToChaptersClicked);
            if (resultBackButton != null)
                resultBackButton.onClick.AddListener(OnResultBackClicked);
            if (resultNextButton != null)
                resultNextButton.onClick.AddListener(OnResultNextClicked);
        }

        private void OnDestroy()
        {
            if (checkButton != null)
                checkButton.onClick.RemoveListener(OnCheckClicked);
            if (backToChaptersButton != null)
                backToChaptersButton.onClick.RemoveListener(OnBackToChaptersClicked);
            if (resultBackButton != null)
                resultBackButton.onClick.RemoveListener(OnResultBackClicked);
            if (resultNextButton != null)
                resultNextButton.onClick.RemoveListener(OnResultNextClicked);
        }

        private void EnsureRuntimeFallback()
        {
            var root = GetComponent<RectTransform>();
            if (root == null)
                root = gameObject.AddComponent<RectTransform>();

            var suppressBack = _context != null && _context.suppressHostedBackChapterNavigation;

            titleText ??= CreateText("Title", root, new Vector2(0.05f, 0.8f), new Vector2(0.95f, 0.95f), 34, FontStyle.Bold, TextAnchor.MiddleCenter, new Color(0.12f, 0.14f, 0.2f, 1f));
            bodyText ??= CreateText("Body", root, new Vector2(0.08f, 0.3f), new Vector2(0.92f, 0.75f), 24, FontStyle.Normal, TextAnchor.MiddleCenter, new Color(0.12f, 0.14f, 0.2f, 1f));

            if (checkButton == null)
            {
                var checkGo = CreateButton("CheckButton", root, new Vector2(0.55f, 0.08f), new Vector2(0.82f, 0.16f), "Check", out _);
                checkButton = checkGo.GetComponent<Button>();
            }

            if (backToChaptersButton == null && !suppressBack)
            {
                var backGo = CreateButton("BackToChaptersButton", root, new Vector2(0.18f, 0.08f), new Vector2(0.45f, 0.16f), "Back to chapters", out _);
                backToChaptersButton = backGo.GetComponent<Button>();
            }

            if (resultOverlayRoot == null)
            {
                resultOverlayRoot = new GameObject("ResultOverlay", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
                resultOverlayRoot.transform.SetParent(root, false);
                var rt = resultOverlayRoot.GetComponent<RectTransform>();
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.offsetMin = Vector2.zero;
                rt.offsetMax = Vector2.zero;
                var image = resultOverlayRoot.GetComponent<Image>();
                image.color = new Color(0f, 0f, 0f, 0.55f);
            }

            var overlayRoot = resultOverlayRoot.GetComponent<RectTransform>();
            resultMessageText ??= CreateText("ResultMessage", overlayRoot, new Vector2(0.2f, 0.62f), new Vector2(0.8f, 0.82f), 30, FontStyle.Bold, TextAnchor.MiddleCenter, Color.white);
            resultPizzaText ??= CreateText("ResultPizza", overlayRoot, new Vector2(0.2f, 0.46f), new Vector2(0.8f, 0.60f), 22, FontStyle.Normal, TextAnchor.MiddleCenter, Color.white);
            resultBackpackText ??= CreateText("ResultBackpack", overlayRoot, new Vector2(0.2f, 0.3f), new Vector2(0.8f, 0.44f), 22, FontStyle.Normal, TextAnchor.MiddleCenter, Color.white);

            if (resultBackButton == null)
            {
                var rb = CreateButton("ResultBackButton", overlayRoot, new Vector2(0.18f, 0.12f), new Vector2(0.45f, 0.22f), "Back", out _);
                resultBackButton = rb.GetComponent<Button>();
            }

            if (resultNextButton == null)
            {
                var rn = CreateButton("ResultNextButton", overlayRoot, new Vector2(0.55f, 0.12f), new Vector2(0.82f, 0.22f), "Next", out _);
                resultNextButton = rn.GetComponent<Button>();
            }
        }

        private static Text CreateText(string name, RectTransform parent, Vector2 anchorMin, Vector2 anchorMax, int fontSize,
            FontStyle style, TextAnchor alignment, Color color)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var text = go.GetComponent<Text>();
            text.font = LanguageGame.Presentation.UiTokenApplier.ResolveFallbackFont();
            text.fontSize = fontSize;
            text.fontStyle = style;
            text.alignment = alignment;
            text.color = color;
            return text;
        }

        private static GameObject CreateButton(string name, RectTransform parent, Vector2 anchorMin, Vector2 anchorMax, string label,
            out Text labelText)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var image = go.GetComponent<Image>();
            image.color = new Color(0.2f, 0.55f, 0.85f, 1f);

            labelText = CreateText("Label", rt, Vector2.zero, Vector2.one, 20, FontStyle.Bold, TextAnchor.MiddleCenter, Color.white);
            labelText.text = label;
            return go;
        }
    }
}
