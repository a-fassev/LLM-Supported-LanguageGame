using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.UI.Screens;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Game.Levels
{
    public sealed class MainMenuSceneController : MonoBehaviour
    {
        private MainMenuView _view;

        private void Start()
        {
            Debug.Log("[WP1][MainMenu] Ready");
            _view = MainMenuView.Create(transform);
            _view.Bind(OnStartClicked);
        }

        private void OnStartClicked()
        {
            if (!GameRoot.IsReady)
            {
                return;
            }

            GameRoot.Services.ErrorState.Clear();
            GameRoot.Services.SceneRouter.LoadScene(GameSceneId.MainHub);
        }
    }
}
