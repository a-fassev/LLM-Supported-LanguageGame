using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class MainMenuView : MonoBehaviour
    {
        [SerializeField] private Button spielenButton;

        private void Awake()
        {
            if (spielenButton == null)
                Debug.LogWarning("[MainMenuView] spielenButton is not assigned.");
        }

        private void Start()
        {
            spielenButton?.onClick.AddListener(OnSpielen);
        }

        private void OnSpielen()
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
            spielenButton?.onClick.RemoveListener(OnSpielen);
        }
    }
}
