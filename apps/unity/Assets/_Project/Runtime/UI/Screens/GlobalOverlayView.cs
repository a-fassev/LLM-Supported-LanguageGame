using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.UI.Common;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace ITBL.LanguageGame.Runtime.UI.Screens
{
    public sealed class GlobalOverlayView : MonoBehaviour
    {
        private GameServices _services;
        private GameObject _loadingPanel;
        private GameObject _errorPanel;
        private TextMeshProUGUI _errorLabel;

        public static GlobalOverlayView Create(Transform parent)
        {
            return UiRuntimeBootstrap.CreateViewOrFallback("UI/Screens/GlobalOverlayView", () =>
            {
                Canvas canvas = UiRuntimeBootstrap.CreateScreenCanvas("GlobalOverlayCanvas", parent, sortingOrder: 1000);
                GlobalOverlayView view = canvas.gameObject.AddComponent<GlobalOverlayView>();
                view.BuildDefaultUi(canvas.transform);
                return view;
            });
        }

        public void Bind(GameServices services)
        {
            _services = services;
        }

        public void Refresh()
        {
            if (_services == null)
            {
                return;
            }

            _loadingPanel.SetActive(_services.SceneRouter.IsLoading);
            bool hasError = _services.ErrorState.HasError;
            _errorPanel.SetActive(hasError);
            if (hasError)
            {
                _errorLabel.text = _services.ErrorState.CurrentMessage;
            }
        }

        private void BuildDefaultUi(Transform root)
        {
            RectTransform loadingRect = UiPrimitives.CreatePanel(
                "LoadingPanel",
                root,
                new Vector2(0f, 1f),
                new Vector2(0f, 1f),
                new Vector2(15f, -55f),
                new Vector2(280f, -15f),
                new Color(1f, 1f, 1f, 0.88f));
            _loadingPanel = loadingRect.gameObject;
            UiPrimitives.CreateLabel("LoadingText", loadingRect, "Lade Szene ...", 22, TextAlignmentOptions.MidlineLeft);

            RectTransform errorRect = UiPrimitives.CreatePanel(
                "ErrorPanel",
                root,
                new Vector2(0f, 1f),
                new Vector2(0f, 1f),
                new Vector2(15f, -220f),
                new Vector2(540f, -70f),
                new Color(1f, 0.95f, 0.95f, 0.95f));
            _errorPanel = errorRect.gameObject;
            UiPrimitives.AddVerticalLayout(errorRect, spacing: 8f);

            _errorLabel = UiPrimitives.CreateLabel("ErrorLabel", errorRect, string.Empty, 18, TextAlignmentOptions.TopLeft);
            LayoutElement errorLayout = _errorLabel.gameObject.AddComponent<LayoutElement>();
            errorLayout.minHeight = 56f;

            RectTransform buttonRow = new GameObject("Buttons").AddComponent<RectTransform>();
            buttonRow.SetParent(errorRect, false);
            HorizontalLayoutGroup horizontalLayout = buttonRow.gameObject.AddComponent<HorizontalLayoutGroup>();
            horizontalLayout.spacing = 10f;
            horizontalLayout.childAlignment = TextAnchor.MiddleLeft;
            horizontalLayout.childControlWidth = false;
            horizontalLayout.childControlHeight = false;

            UiPrimitives.CreateButton("BackToHubButton", buttonRow, "Zum Hub zurueck", () =>
            {
                _services?.ErrorState.Clear();
                _services?.SceneRouter.LoadScene(GameSceneId.MainHub);
            });
            UiPrimitives.CreateButton("BackToMenuButton", buttonRow, "Zum Menue", () =>
            {
                _services?.ErrorState.Clear();
                _services?.SceneRouter.LoadScene(GameSceneId.MainMenu);
            });

            _loadingPanel.SetActive(false);
            _errorPanel.SetActive(false);
        }
    }
}
