using System;
using ITBL.LanguageGame.Runtime.UI.Common;
using TMPro;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.UI.Screens
{
    public sealed class MainMenuView : MonoBehaviour
    {
        private Action _onStartClicked;

        public static MainMenuView Create(Transform parent)
        {
            return UiRuntimeBootstrap.CreateViewOrFallback("UI/Screens/MainMenuView", () =>
            {
                Canvas canvas = UiRuntimeBootstrap.CreateScreenCanvas("MainMenuCanvas", parent);
                MainMenuView view = canvas.gameObject.AddComponent<MainMenuView>();
                view.BuildDefaultUi(canvas.transform);
                return view;
            });
        }

        public void Bind(Action onStartClicked)
        {
            _onStartClicked = onStartClicked;
        }

        private void BuildDefaultUi(Transform root)
        {
            RectTransform panel = UiPrimitives.CreatePanel(
                "Panel",
                root,
                new Vector2(0f, 1f),
                new Vector2(0f, 1f),
                new Vector2(20f, -200f),
                new Vector2(420f, -20f),
                new Color(1f, 1f, 1f, 0.9f));
            UiPrimitives.AddVerticalLayout(panel, spacing: 10f);

            UiPrimitives.CreateLabel("Title", panel, "Italian Lernspiel", 34, TextAlignmentOptions.Left);
            UiPrimitives.CreateLabel("Subtitle", panel, "Workpackage 1 - Core Foundation", 21, TextAlignmentOptions.Left);
            UiPrimitives.CreateButton("StartButton", panel, "Start", () => _onStartClicked?.Invoke());
        }
    }
}
