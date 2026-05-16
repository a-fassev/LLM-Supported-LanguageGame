using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Runtime-built bottom banner (message + Retry). Used for bootstrap, start-quest, and other load failures.
    /// Call <see cref="Ensure"/> once to build the widget, then <see cref="Show"/>/<see cref="Hide"/> as needed.
    /// </summary>
    public sealed class LoadErrorBanner
    {
        // Layout ratios within the banner strip (normalized 0-1 on the banner's width).
        private const float MessageMaxX   = 0.74f;
        private const float RetryMinX     = 0.77f;
        private const float RetryMaxX     = 0.97f;

        private GameObject _root;
        private Text       _messageText;
        private Button     _retryButton;

        /// <summary>
        /// Builds the banner if it has not been built yet.
        /// <para>Pass <paramref name="tokens"/> from <see cref="UiThemeProvider.TryGet"/>. When <c>null</c> the
        /// banner falls back to hardcoded values that match the token defaults.</para>
        /// </summary>
        public void Ensure(Canvas canvas, UiDesignTokens tokens)
        {
            if (_root != null)
                return;

            if (canvas == null)
            {
                Debug.LogError("[LoadErrorBanner] Ensure called with null Canvas.");
                return;
            }

            var font = tokens != null
                ? UiTokenApplier.ResolveFont(tokens.typography.caption)
                : UiTokenApplier.ResolveFallbackFont();

            if (font == null)
            {
                Debug.LogError("[LoadErrorBanner] No fallback font available.");
                return;
            }

            // Derive values from tokens with inline fallbacks matching token defaults.
            var bannerHeight  = tokens?.layout.bannerHeight      ?? 120f;
            var captionSize   = tokens?.typography.caption.fontSize ?? 22;
            var errorBg       = tokens?.palette.errorBackground   ?? new Color(0.12f, 0.02f, 0.02f, 0.94f);
            var errorTxt      = tokens?.palette.errorText         ?? new Color(1f, 0.85f, 0.85f, 1f);
            var primaryColor  = tokens?.palette.primary           ?? new Color(0.2f, 0.55f, 0.85f, 1f);
            var onPrimary     = tokens?.palette.onPrimary         ?? Color.white;
            var insetS        = tokens?.spacing.s                 ?? 8f;
            var insetM        = tokens?.spacing.m                 ?? 16f;

            var root = new GameObject("LoadErrorBanner", typeof(RectTransform));
            root.transform.SetParent(canvas.transform, false);
            var rootRt = root.GetComponent<RectTransform>();
            rootRt.anchorMin        = new Vector2(0f, 0f);
            rootRt.anchorMax        = new Vector2(1f, 0f);
            rootRt.pivot            = new Vector2(0.5f, 0f);
            rootRt.anchoredPosition = Vector2.zero;
            rootRt.sizeDelta        = new Vector2(0f, bannerHeight);

            var panel = root.AddComponent<Image>();
            panel.color = errorBg;

            var msgGo = new GameObject("Message", typeof(RectTransform));
            msgGo.transform.SetParent(root.transform, false);
            var msgRt = msgGo.GetComponent<RectTransform>();
            msgRt.anchorMin  = new Vector2(0f, 0.35f);
            msgRt.anchorMax  = new Vector2(MessageMaxX, 0.95f);
            msgRt.offsetMin  = new Vector2(insetM, 0f);
            msgRt.offsetMax  = new Vector2(-insetS, -insetS * 0.5f);
            var msg = msgGo.AddComponent<Text>();
            msg.font      = font;
            msg.fontSize  = captionSize;
            msg.color     = errorTxt;
            msg.alignment = TextAnchor.MiddleLeft;
            _messageText  = msg;

            var btnGo = new GameObject("Retry", typeof(RectTransform));
            btnGo.transform.SetParent(root.transform, false);
            var btnRt = btnGo.GetComponent<RectTransform>();
            btnRt.anchorMin  = new Vector2(RetryMinX, 0.2f);
            btnRt.anchorMax  = new Vector2(RetryMaxX, 0.8f);
            btnRt.offsetMin  = Vector2.zero;
            btnRt.offsetMax  = Vector2.zero;
            var btnImg = btnGo.AddComponent<Image>();
            btnImg.color = primaryColor;
            var btn = btnGo.AddComponent<Button>();

            var btnLblGo = new GameObject("Label", typeof(RectTransform));
            btnLblGo.transform.SetParent(btnGo.transform, false);
            var btnLblRt = btnLblGo.GetComponent<RectTransform>();
            UiTokenApplier.StretchFull(btnLblRt);
            var btnTxt = btnLblGo.AddComponent<Text>();
            btnTxt.font      = font;
            btnTxt.fontSize  = captionSize;
            btnTxt.color     = onPrimary;
            btnTxt.alignment = TextAnchor.MiddleCenter;
            btnTxt.text      = "Retry";

            btn.targetGraphic = btnImg;
            _retryButton      = btn;

            _root = root;
            _root.SetActive(false);
        }

        public void Show(string message, UnityAction onRetry)
        {
            if (_messageText != null)
                _messageText.text = message;
            if (_retryButton != null)
            {
                _retryButton.onClick.RemoveAllListeners();
                if (onRetry != null)
                    _retryButton.onClick.AddListener(onRetry);
            }
            if (_root != null)
                _root.SetActive(true);
            else
                Debug.LogError("[LoadErrorBanner] Show called but banner was not built; call Ensure first.");
        }

        public void Hide()
        {
            if (_root != null)
                _root.SetActive(false);
        }

        public void SetRetryInteractable(bool interactable)
        {
            if (_retryButton != null)
                _retryButton.interactable = interactable;
        }

        public void Destroy()
        {
            if (_root == null)
                return;
            Object.Destroy(_root);
            _root        = null;
            _messageText = null;
            _retryButton = null;
        }
    }
}
