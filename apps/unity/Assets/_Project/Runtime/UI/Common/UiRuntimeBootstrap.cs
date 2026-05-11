using System;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
using UnityEngine.UI;

namespace ITBL.LanguageGame.Runtime.UI.Common
{
    public static class UiRuntimeBootstrap
    {
        private static TMP_FontAsset _defaultFontAsset;

        public static EventSystem EnsureEventSystem()
        {
            EventSystem existing = UnityEngine.Object.FindFirstObjectByType<EventSystem>();
            if (existing != null)
            {
                return existing;
            }

            GameObject eventSystemObject = new("EventSystem");
            EventSystem eventSystem = eventSystemObject.AddComponent<EventSystem>();
            InputSystemUIInputModule inputModule = eventSystemObject.AddComponent<InputSystemUIInputModule>();
            inputModule.actionsAsset = InputSystem.actions;
            UnityEngine.Object.DontDestroyOnLoad(eventSystemObject);
            return eventSystem;
        }

        public static Canvas CreateScreenCanvas(string name, Transform parent, int sortingOrder = 0)
        {
            GameObject canvasObject = new(name);
            if (parent != null)
            {
                canvasObject.transform.SetParent(parent, false);
            }

            Canvas canvas = canvasObject.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = sortingOrder;
            canvasObject.AddComponent<GraphicRaycaster>();
            CanvasScaler scaler = canvasObject.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(960f, 600f);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;
            return canvas;
        }

        public static T CreateViewOrFallback<T>(string resourcesPath, Func<T> fallbackFactory) where T : Component
        {
            GameObject prefab = Resources.Load<GameObject>(resourcesPath);
            if (prefab != null)
            {
                T fromPrefab = UnityEngine.Object.Instantiate(prefab).GetComponent<T>();
                if (fromPrefab != null)
                {
                    return fromPrefab;
                }
            }

            return fallbackFactory();
        }

        public static TMP_FontAsset ResolveDefaultFont()
        {
            if (_defaultFontAsset != null)
            {
                return _defaultFontAsset;
            }

            _defaultFontAsset = TMP_Settings.defaultFontAsset;
            return _defaultFontAsset;
        }
    }
}
