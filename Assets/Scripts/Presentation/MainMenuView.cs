using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class MainMenuView : MonoBehaviour
    {
        [SerializeField] private Button playButton;

        private void Awake()
        {
            if (playButton == null)
                Debug.LogWarning("[MainMenuView] playButton is not assigned.");
        }

        private void Start()
        {
            playButton?.onClick.AddListener(OnPlayClicked);
        }

        private void OnPlayClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[MainMenuView] GameFlowController not found.");
                return;
            }
            GameFlowController.Instance.LoadCityMap();
        }

        private void OnDestroy()
        {
            playButton?.onClick.RemoveListener(OnPlayClicked);
        }
    }
}
