using UnityEngine;
using UnityEngine.UI;

namespace LanguageGame.Presentation
{
    /// <summary>Modal for locked chapter / quest selection hints.</summary>
    public sealed class UnlockHintModalPresenter
    {
        private GameObject _root;
        private Text _titleText;
        private Text _messageText;

        public void Ensure(Canvas canvas, UiDesignTokens tokens, Font fallbackFont)
        {
            if (_root != null || canvas == null)
                return;

            var overlayColor = tokens?.palette.overlay ?? new Color(0f, 0f, 0f, 0.55f);
            var surfaceColor = tokens?.palette.surface ?? new Color(0.12f, 0.12f, 0.14f, 1f);
            var primaryColor = tokens?.palette.primary ?? new Color(0.2f, 0.55f, 0.85f, 1f);
            var textColor = tokens?.palette.textPrimary ?? Color.white;

            var font = fallbackFont != null ? fallbackFont : UiTokenApplier.ResolveFont(tokens?.typography.body);
            var msgFontSize = tokens?.typography.caption.fontSize ?? 22;
            var titleSize = Mathf.Clamp(tokens?.typography.title.fontSize / 2 ?? 26, 22, 34);

            var dlgW = tokens?.layout.dialogWidth ?? 520f;
            var dlgH = tokens?.layout.dialogHeight ?? 280f;

            _root = new GameObject("UnlockHintOverlay", typeof(RectTransform));
            _root.transform.SetParent(canvas.transform, false);
            var rootRt = _root.GetComponent<RectTransform>();
            rootRt.anchorMin = Vector2.zero;
            rootRt.anchorMax = Vector2.one;
            rootRt.offsetMin = Vector2.zero;
            rootRt.offsetMax = Vector2.zero;
            rootRt.SetAsLastSibling();

            var dim = _root.AddComponent<Image>();
            dim.color = overlayColor;
            dim.raycastTarget = true;

            var panel = new GameObject("Panel", typeof(RectTransform));
            panel.transform.SetParent(_root.transform, false);
            var panelRt = panel.GetComponent<RectTransform>();
            panelRt.anchorMin = new Vector2(0.5f, 0.5f);
            panelRt.anchorMax = new Vector2(0.5f, 0.5f);
            panelRt.pivot = new Vector2(0.5f, 0.5f);
            panelRt.anchoredPosition = Vector2.zero;
            panelRt.sizeDelta = new Vector2(dlgW, dlgH);

            var panelImg = panel.AddComponent<Image>();
            panelImg.color = surfaceColor;
            panelImg.raycastTarget = true;

            _titleText = PatchText(panel.transform, "Title", font, Mathf.RoundToInt(titleSize), TextAnchor.MiddleCenter,
                textColor, new Vector2(0.06f, 0.74f), new Vector2(0.94f, 0.92f));

            _messageText = PatchText(panel.transform, "Message", font, Mathf.RoundToInt(msgFontSize), TextAnchor.UpperCenter,
                textColor, new Vector2(0.06f, 0.14f), new Vector2(0.94f, 0.72f));
            if (_messageText != null)
            {
                _messageText.horizontalOverflow = HorizontalWrapMode.Wrap;
                _messageText.verticalOverflow = VerticalWrapMode.Overflow;
            }

            var okGo = new GameObject("GotItButton", typeof(RectTransform), typeof(Image), typeof(Button));
            okGo.transform.SetParent(panel.transform, false);
            var okRt = okGo.GetComponent<RectTransform>();
            okRt.anchorMin = new Vector2(0.32f, 0.06f);
            okRt.anchorMax = new Vector2(0.68f, 0.14f);
            okRt.offsetMin = Vector2.zero;
            okRt.offsetMax = Vector2.zero;
            var okImg = okGo.GetComponent<Image>();
            okImg.color = primaryColor;
            var okBtn = okGo.GetComponent<Button>();
            okBtn.targetGraphic = okImg;

            var labelGo = new GameObject("Label", typeof(RectTransform), typeof(Text));
            labelGo.transform.SetParent(okGo.transform, false);
            var lblRt = labelGo.GetComponent<RectTransform>();
            UiTokenApplier.StretchFull(lblRt);
            var lbl = labelGo.GetComponent<Text>();
            lbl.font = font;
            lbl.fontSize = Mathf.Clamp(tokens?.typography.small.fontSize ?? 18, 14, 24);
            lbl.alignment = TextAnchor.MiddleCenter;
            lbl.color = textColor;
            lbl.text = "Got it";

            okBtn.onClick.AddListener(Hide);

            _root.SetActive(false);
        }

        public void Show(string title, string message)
        {
            if (_root == null)
                return;
            if (_titleText != null)
                _titleText.text = title ?? string.Empty;
            if (_messageText != null)
                _messageText.text = message ?? string.Empty;
            _root.SetActive(true);
        }

        public void Hide()
        {
            if (_root != null)
                _root.SetActive(false);
        }

        public void Destroy()
        {
            if (_root != null)
                Object.Destroy(_root);
            _root = null;
        }

        private static Text PatchText(Transform parent, string name, Font font, int size, TextAnchor anchor, Color color,
            Vector2 aMin, Vector2 aMax)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = aMin;
            rt.anchorMax = aMax;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var t = go.GetComponent<Text>();
            t.font = font;
            t.fontSize = size;
            t.alignment = anchor;
            t.color = color;
            return t;
        }
    }
}
