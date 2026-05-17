using System;
using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Presentation;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>Task mechanics only — navigation (Back / Check) and shared dialogs live on the quest shell.</summary>
    public class TaskStepBase : MonoBehaviour, IStepView, ISubmitFromShell
    {
        /// <summary>Shown when a task prefab still uses a placeholder mechanic; override <see cref="ValidateBeforeComplete"/> in real implementations.</summary>
        protected const string UnimplementedTaskMechanicMessage = "This task type is not implemented yet.";
        [SerializeField] protected Text titleText;
        [SerializeField] protected Text bodyText;

        private Action<StepCompletionRequest> _onRequest;
        private StepContext _context;

        public void Bind(StepContext context, Action<StepCompletionRequest> onRequest)
        {
            _context = context ?? new StepContext();
            _onRequest = onRequest;

            EnsureRuntimeFallback();
            ApplyChromeFromDesignTokens();

            var kind = context?.taskType;
            if (titleText != null)
                titleText.text = string.IsNullOrEmpty(kind) ? "Task" : kind;
            ApplyTaskContent(context);
        }

        /// <summary>Populate task body / dynamic content after <see cref="EnsureRuntimeFallback"/>.</summary>
        protected virtual void ApplyTaskContent(StepContext context)
        {
            if (bodyText != null)
                bodyText.text = string.IsNullOrEmpty(context?.contentJson)
                    ? "(task placeholder)"
                    : context.contentJson;
        }

        public virtual void SetInteractable(bool interactable)
        {
        }

        public void Teardown()
        {
            _onRequest = null;
            _context = null;
        }

        public void SubmitFromShell()
        {
            if (!ValidateBeforeComplete())
                return;
            _onRequest?.Invoke(new StepCompletionRequest { requestComplete = true });
        }

        /// <summary>Return false to block submit; use <see cref="PresentValidationFeedback"/> for shell messaging.</summary>
        protected virtual bool ValidateBeforeComplete() => true;

        protected void PresentValidationFeedback(string message)
        {
            if (string.IsNullOrEmpty(message))
                return;
            _context?.presentValidationMessage?.Invoke(message);
        }

        /// <summary>
        /// Binds typography and palette to editor-authored content. Override in task types that own extra widgets.
        /// </summary>
        protected virtual void ApplyChromeFromDesignTokens()
        {
            if (!UiThemeProvider.TryGet(out var t))
                return;

            var panelFallback = new Color(0.95f, 0.95f, 0.97f, 1f);

            if (titleText != null)
            {
                var bg = UiTokenApplier.GetPanelBackgroundNear(titleText.rectTransform, panelFallback);
                var fg = UiTokenApplier.ResolveReadableOnBackground(t.palette.textPrimary, bg);
                UiTokenApplier.ApplyText(titleText, t.typography.title, fg);
                titleText.fontStyle = FontStyle.Bold;
            }

            if (bodyText != null)
            {
                var bg = UiTokenApplier.GetPanelBackgroundNear(bodyText.rectTransform, panelFallback);
                var fg = UiTokenApplier.ResolveReadableOnBackground(t.palette.textPrimary, bg);
                UiTokenApplier.ApplyText(bodyText, t.typography.body, fg);
            }
        }

        private void EnsureRuntimeFallback()
        {
            var root = GetComponent<RectTransform>();
            if (root == null)
                root = gameObject.AddComponent<RectTransform>();

            titleText ??= CreateText("Title", root, new Vector2(0.05f, 0.8f), new Vector2(0.95f, 0.95f), 34, FontStyle.Bold, TextAnchor.MiddleCenter, new Color(0.12f, 0.14f, 0.2f, 1f));
            bodyText ??= CreateText("Body", root, new Vector2(0.08f, 0.3f), new Vector2(0.92f, 0.75f), 24, FontStyle.Normal, TextAnchor.MiddleCenter, new Color(0.12f, 0.14f, 0.2f, 1f));
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
    }
}
