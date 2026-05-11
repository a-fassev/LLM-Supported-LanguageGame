using ITBL.LanguageGame.Runtime.Core;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Game.Levels
{
    public sealed class MainMenuSceneController : MonoBehaviour
    {
        private void Start()
        {
            Debug.Log("[WP1][MainMenu] Ready");
        }

        private void OnGUI()
        {
            if (!GameRoot.IsReady)
            {
                return;
            }

            GUI.Box(new Rect(20, 20, 360, 150), "Italian Lernspiel");
            GUI.Label(new Rect(35, 50, 330, 25), "Workpackage 1 - Core Foundation");

            if (GUI.Button(new Rect(35, 85, 150, 35), "Start"))
            {
                GameRoot.Services.ErrorState.Clear();
                GameRoot.Services.SceneRouter.LoadScene(GameSceneId.MainHub);
            }
        }
    }
}
