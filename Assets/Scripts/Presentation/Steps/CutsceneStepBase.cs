using System;
using UnityEngine;
using UnityEngine.UI;

namespace LanguageGame.Presentation.Steps
{
    public class CutsceneStepBase : MonoBehaviour, IStepView
    {
        [SerializeField] private Text titleText;
        [SerializeField] private Text bodyText;
        [SerializeField] private Button continueButton;

        private Action<StepCompletionRequest> _onRequest;

        private void Awake()
        {
            EnsureRuntimeFallback();
            if (continueButton != null)
                continueButton.onClick.AddListener(OnContinueClicked);
        }

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _onRequest = onRequest;
            if (titleText != null)
                titleText.text = "Cutscene";

            if (bodyText != null)
                bodyText.text = string.IsNullOrEmpty(context?.contentJson)
                    ? "(cutscene placeholder)"
                    : context.contentJson;
        }

        public void SetInteractable(bool interactable)
        {
            if (continueButton != null)
                continueButton.interactable = interactable;
        }

        public void Teardown()
        {
            _onRequest = null;
        }

        private void OnContinueClicked()
        {
            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        private void OnDestroy()
        {
            if (continueButton != null)
                continueButton.onClick.RemoveListener(OnContinueClicked);
        }

        private void EnsureRuntimeFallback()
        {
            if (titleText != null && bodyText != null && continueButton != null)
                return;

            var root = GetComponent<RectTransform>();
            if (root == null)
                root = gameObject.AddComponent<RectTransform>();

            titleText ??= CreateText("Title", root, new Vector2(0.05f, 0.8f), new Vector2(0.95f, 0.95f), 34, FontStyle.Bold);
            bodyText ??= CreateText("Body", root, new Vector2(0.08f, 0.25f), new Vector2(0.92f, 0.75f), 24, FontStyle.Normal);

            if (continueButton == null)
            {
                // Match Quest scene primary left-strip CTA sizing (avoid overlap with shell back button)
                var buttonGo = CreateButton("ContinueButton", root, new Vector2(0.05f, 0.06f), new Vector2(0.32f, 0.16f), "Next",
                    out var label);
                continueButton = buttonGo.GetComponent<Button>();
                if (label != null)
                {
                    label.fontStyle = FontStyle.Bold;
                    label.fontSize = 24;
                }
            }
        }

        private static Text CreateText(string name, RectTransform parent, Vector2 anchorMin, Vector2 anchorMax,
            int fontSize, FontStyle style)
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
            text.alignment = TextAnchor.MiddleCenter;
            text.color = new Color(0.12f, 0.14f, 0.2f, 1f);
            return text;
        }

        private static GameObject CreateButton(string name, RectTransform parent, Vector2 anchorMin, Vector2 anchorMax,
            string label, out Text labelText)
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

            labelText = CreateText("Label", rt, Vector2.zero, Vector2.one, 22, FontStyle.Normal);
            labelText.text = label;
            labelText.color = Color.white;
            return go;
        }
    }
}
