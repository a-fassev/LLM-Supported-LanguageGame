using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

namespace LanguageGame.Presentation
{
    /// <summary>
    /// Runtime-built bottom banner (message + Retry). Used for bootstrap, start-level, and other load failures.
    /// Caller passes the retry action on each Show.
    /// </summary>
    public sealed class LoadErrorBanner
    {
        private GameObject _root;
        private Text _messageText;
        private Button _retryButton;

        public void Ensure(
            Canvas canvas,
            Font refFont,
            float bannerHeight,
            float messageAreaMaxX,
            float retryAreaMinX,
            float retryAreaMaxX,
            float fontSize)
        {
            if (_root != null)
                return;

            if (canvas == null)
            {
                Debug.LogError("[LoadErrorBanner] Ensure called with null Canvas.");
                return;
            }

            if (refFont == null)
                refFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (refFont == null)
            {
                Debug.LogError("[LoadErrorBanner] No font available (LegacyRuntime.ttf missing).");
                return;
            }

            var root = new GameObject("LoadErrorBanner", typeof(RectTransform));
            root.transform.SetParent(canvas.transform, false);
            var rootRt = root.GetComponent<RectTransform>();
            rootRt.anchorMin = new Vector2(0f, 0f);
            rootRt.anchorMax = new Vector2(1f, 0f);
            rootRt.pivot = new Vector2(0.5f, 0f);
            rootRt.anchoredPosition = new Vector2(0f, 0f);
            rootRt.sizeDelta = new Vector2(0f, bannerHeight);

            var panel = root.AddComponent<Image>();
            panel.color = new Color(0.12f, 0.02f, 0.02f, 0.94f);

            var msgGo = new GameObject("Message", typeof(RectTransform));
            msgGo.transform.SetParent(root.transform, false);
            var msgRt = msgGo.GetComponent<RectTransform>();
            msgRt.anchorMin = new Vector2(0f, 0.35f);
            msgRt.anchorMax = new Vector2(messageAreaMaxX, 0.95f);
            msgRt.offsetMin = new Vector2(16f, 0f);
            msgRt.offsetMax = new Vector2(-8f, -4f);
            var msg = msgGo.AddComponent<Text>();
            msg.font = refFont;
            msg.fontSize = (int)fontSize;
            msg.color = new Color(1f, 0.85f, 0.85f, 1f);
            msg.alignment = TextAnchor.MiddleLeft;
            _messageText = msg;

            var btnGo = new GameObject("Retry", typeof(RectTransform));
            btnGo.transform.SetParent(root.transform, false);
            var btnRt = btnGo.GetComponent<RectTransform>();
            btnRt.anchorMin = new Vector2(retryAreaMinX, 0.2f);
            btnRt.anchorMax = new Vector2(retryAreaMaxX, 0.8f);
            btnRt.offsetMin = Vector2.zero;
            btnRt.offsetMax = Vector2.zero;
            var btnImg = btnGo.AddComponent<Image>();
            btnImg.color = new Color(0.25f, 0.45f, 0.85f, 1f);
            var btn = btnGo.AddComponent<Button>();
            var btnLblGo = new GameObject("Label", typeof(RectTransform));
            btnLblGo.transform.SetParent(btnGo.transform, false);
            var btnLblRt = btnLblGo.GetComponent<RectTransform>();
            btnLblRt.anchorMin = Vector2.zero;
            btnLblRt.anchorMax = Vector2.one;
            btnLblRt.offsetMin = Vector2.zero;
            btnLblRt.offsetMax = Vector2.zero;
            var btnTxt = btnLblGo.AddComponent<Text>();
            btnTxt.font = refFont;
            btnTxt.fontSize = (int)fontSize;
            btnTxt.color = Color.white;
            btnTxt.alignment = TextAnchor.MiddleCenter;
            btnTxt.text = "Retry";
            btn.targetGraphic = btnImg;
            _retryButton = btn;

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
            _root = null;
            _messageText = null;
            _retryButton = null;
        }
    }
}
