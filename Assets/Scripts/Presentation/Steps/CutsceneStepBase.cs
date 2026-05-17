using System;
using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Presentation;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Cutscene content only — advance via quest shell <b>Next</b>.</summary>
    public class CutsceneStepBase : MonoBehaviour, IStepView
    {
        [SerializeField] private Text titleText;
        [SerializeField] private Text bodyText;

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            EnsureRuntimeFallback();
            ApplyChromeFromTokens();

            if (titleText != null)
                titleText.text = "Cutscene";

            if (bodyText != null)
                bodyText.text = string.IsNullOrEmpty(context?.contentJson)
                    ? "(cutscene placeholder)"
                    : context.contentJson;
        }

        private void ApplyChromeFromTokens()
        {
            if (!UiThemeProvider.TryGet(out var t))
                return;
            if (titleText != null)
            {
                var bg = UiTokenApplier.GetPanelBackgroundNear(titleText.rectTransform,
                    new Color(0.95f, 0.95f, 0.97f, 1f));
                var fg = UiTokenApplier.ResolveReadableOnBackground(t.palette.textPrimary, bg);
                UiTokenApplier.ApplyText(titleText, t.typography.title, fg);
                titleText.fontStyle = FontStyle.Bold;
            }

            if (bodyText != null)
            {
                var bg = UiTokenApplier.GetPanelBackgroundNear(bodyText.rectTransform,
                    new Color(0.95f, 0.95f, 0.97f, 1f));
                var fg = UiTokenApplier.ResolveReadableOnBackground(t.palette.textPrimary, bg);
                UiTokenApplier.ApplyText(bodyText, t.typography.body, fg);
            }
        }

        public void SetInteractable(bool interactable)
        {
        }

        public void Teardown()
        {
        }

        private void EnsureRuntimeFallback()
        {
            var root = GetComponent<RectTransform>();
            if (root == null)
                root = gameObject.AddComponent<RectTransform>();

            titleText ??= CreateText("Title", root, new Vector2(0.05f, 0.8f), new Vector2(0.95f, 0.95f), 34, FontStyle.Bold);
            bodyText ??= CreateText("Body", root, new Vector2(0.08f, 0.25f), new Vector2(0.92f, 0.75f), 24, FontStyle.Normal);
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
    }
}
