using UnityEngine;
using UnityEngine.UI;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Runtime-built full-screen loading overlay for blocking transitions.
    /// </summary>
    public sealed class LoadingOverlayPresenter
    {
        private GameObject _root;
        private Text _messageText;
        public bool IsReady => _root != null;

        public bool Ensure(Canvas canvas, UiDesignTokens tokens)
        {
            if (_root != null)
                return true;

            if (canvas == null)
            {
                Debug.LogError("[LoadingOverlayPresenter] Ensure called with null Canvas.");
                return false;
            }

            var font = tokens != null
                ? UiTokenApplier.ResolveFont(tokens.typography.caption)
                : UiTokenApplier.ResolveFallbackFont();

            if (font == null)
            {
                Debug.LogError("[LoadingOverlayPresenter] No fallback font available.");
                return false;
            }

            var overlayColor = tokens?.palette.overlay ?? new Color(0f, 0f, 0f, 0.55f);
            var panelColor = tokens?.palette.surface ?? new Color(0.12f, 0.12f, 0.14f, 0.96f);
            var textColor = tokens?.palette.textPrimary ?? Color.white;
            var panelWidth = tokens?.layout.dialogWidth ?? 520f;
            var panelHeight = (tokens?.layout.dialogHeight ?? 240f) * 0.5f;
            var textSize = tokens?.typography.title.fontSize ?? 28;

            _root = new GameObject("LoadingOverlay", typeof(RectTransform));
            _root.transform.SetParent(canvas.transform, false);
            var rootRt = _root.GetComponent<RectTransform>();
            UiTokenApplier.StretchFull(rootRt);
            rootRt.SetAsLastSibling();

            var overlay = _root.AddComponent<Image>();
            overlay.color = overlayColor;
            overlay.raycastTarget = true;

            var panel = new GameObject("Panel", typeof(RectTransform));
            panel.transform.SetParent(_root.transform, false);
            var panelRt = panel.GetComponent<RectTransform>();
            panelRt.anchorMin = new Vector2(0.5f, 0.5f);
            panelRt.anchorMax = new Vector2(0.5f, 0.5f);
            panelRt.pivot = new Vector2(0.5f, 0.5f);
            panelRt.anchoredPosition = Vector2.zero;
            panelRt.sizeDelta = new Vector2(panelWidth, panelHeight);

            var panelImg = panel.AddComponent<Image>();
            panelImg.color = panelColor;
            panelImg.raycastTarget = true;

            var labelGo = new GameObject("Message", typeof(RectTransform));
            labelGo.transform.SetParent(panel.transform, false);
            var labelRt = labelGo.GetComponent<RectTransform>();
            UiTokenApplier.StretchFull(labelRt);
            labelRt.offsetMin = new Vector2(24f, 16f);
            labelRt.offsetMax = new Vector2(-24f, -16f);

            var label = labelGo.AddComponent<Text>();
            label.font = font;
            label.fontSize = textSize;
            label.color = textColor;
            label.alignment = TextAnchor.MiddleCenter;
            label.horizontalOverflow = HorizontalWrapMode.Wrap;
            label.verticalOverflow = VerticalWrapMode.Truncate;
            label.text = "Loading...";
            _messageText = label;

            _root.SetActive(false);
            return true;
        }

        public bool Show(string message)
        {
            if (_root == null)
            {
                Debug.LogError("[LoadingOverlayPresenter] Show called before Ensure.");
                return false;
            }

            if (_messageText != null)
                _messageText.text = string.IsNullOrEmpty(message) ? "Loading..." : message;

            _root.SetActive(true);
            return true;
        }

        public void Hide()
        {
            if (_root != null)
                _root.SetActive(false);
        }

        public void Destroy()
        {
            if (_root == null)
                return;
            Object.Destroy(_root);
            _root = null;
            _messageText = null;
        }
    }
}
