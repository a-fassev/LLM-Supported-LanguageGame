using System;
using TMPro;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

namespace ITBL.LanguageGame.Runtime.UI.Common
{
    public static class UiPrimitives
    {
        public static RectTransform CreatePanel(string name, Transform parent, Vector2 anchorMin, Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax, Color color)
        {
            GameObject panelObject = new(name);
            panelObject.transform.SetParent(parent, false);
            Image image = panelObject.AddComponent<Image>();
            image.color = color;
            RectTransform rect = panelObject.GetComponent<RectTransform>();
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.offsetMin = offsetMin;
            rect.offsetMax = offsetMax;
            return rect;
        }

        public static TextMeshProUGUI CreateLabel(string name, Transform parent, string text, int fontSize, TextAlignmentOptions alignment)
        {
            GameObject labelObject = new(name);
            labelObject.transform.SetParent(parent, false);
            TextMeshProUGUI label = labelObject.AddComponent<TextMeshProUGUI>();
            label.font = UiRuntimeBootstrap.ResolveDefaultFont();
            label.text = text;
            label.fontSize = fontSize;
            label.color = Color.black;
            label.alignment = alignment;
            label.enableWordWrapping = true;
            RectTransform rect = label.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(0f, fontSize + 12f);
            return label;
        }

        public static Button CreateButton(string name, Transform parent, string text, UnityAction onClick)
        {
            GameObject buttonObject = new(name);
            buttonObject.transform.SetParent(parent, false);
            Image image = buttonObject.AddComponent<Image>();
            image.color = new Color(0.9f, 0.9f, 0.95f, 1f);
            Button button = buttonObject.AddComponent<Button>();
            if (onClick != null)
            {
                button.onClick.AddListener(onClick);
            }

            RectTransform buttonRect = buttonObject.GetComponent<RectTransform>();
            buttonRect.sizeDelta = new Vector2(220f, 36f);

            TextMeshProUGUI label = CreateLabel("Label", buttonObject.transform, text, 20, TextAlignmentOptions.Center);
            RectTransform labelRect = label.GetComponent<RectTransform>();
            labelRect.anchorMin = Vector2.zero;
            labelRect.anchorMax = Vector2.one;
            labelRect.offsetMin = Vector2.zero;
            labelRect.offsetMax = Vector2.zero;
            return button;
        }

        public static TMP_InputField CreateInputField(
            string name,
            Transform parent,
            string placeholderText,
            string initialValue,
            Action<string> onValueChanged)
        {
            GameObject inputObject = new(name);
            inputObject.transform.SetParent(parent, false);
            Image image = inputObject.AddComponent<Image>();
            image.color = Color.white;
            TMP_InputField input = inputObject.AddComponent<TMP_InputField>();
            RectTransform inputRect = inputObject.GetComponent<RectTransform>();
            inputRect.sizeDelta = new Vector2(680f, 34f);

            TextMeshProUGUI text = CreateLabel("Text", inputObject.transform, initialValue ?? string.Empty, 18, TextAlignmentOptions.Left);
            text.enableWordWrapping = false;
            text.margin = new Vector4(8f, 6f, 8f, 6f);
            RectTransform textRect = text.GetComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = Vector2.zero;
            textRect.offsetMax = Vector2.zero;
            input.textComponent = text;

            TextMeshProUGUI placeholder = CreateLabel("Placeholder", inputObject.transform, placeholderText, 18, TextAlignmentOptions.Left);
            placeholder.color = new Color(0.3f, 0.3f, 0.3f, 0.65f);
            placeholder.margin = new Vector4(8f, 6f, 8f, 6f);
            RectTransform placeholderRect = placeholder.GetComponent<RectTransform>();
            placeholderRect.anchorMin = Vector2.zero;
            placeholderRect.anchorMax = Vector2.one;
            placeholderRect.offsetMin = Vector2.zero;
            placeholderRect.offsetMax = Vector2.zero;
            input.placeholder = placeholder;
            input.text = initialValue ?? string.Empty;

            if (onValueChanged != null)
            {
                input.onValueChanged.AddListener(newValue => onValueChanged(newValue));
            }

            return input;
        }

        public static VerticalLayoutGroup AddVerticalLayout(Transform target, float spacing = 10f, bool forceExpandHeight = false)
        {
            VerticalLayoutGroup layout = target.gameObject.AddComponent<VerticalLayoutGroup>();
            layout.padding = new RectOffset(12, 12, 12, 12);
            layout.spacing = spacing;
            layout.childAlignment = TextAnchor.UpperLeft;
            layout.childControlWidth = true;
            layout.childControlHeight = false;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = forceExpandHeight;
            return layout;
        }
    }
}
