using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Core
{
    public sealed class GameBootstrap : MonoBehaviour
    {
        private bool _hasStarted;

        private void Start()
        {
            if (_hasStarted)
            {
                return;
            }

            _hasStarted = true;

            if (!GameRoot.IsReady)
            {
                GameObject root = new("GameRoot");
                root.AddComponent<GameRoot>();
            }

            GameRoot.Services.SceneRouter.LoadScene(GameSceneId.MainMenu);
        }
    }
}
