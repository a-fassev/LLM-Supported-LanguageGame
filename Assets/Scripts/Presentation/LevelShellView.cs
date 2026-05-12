using UnityEngine;
using UnityEngine.Serialization;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class LevelShellView : MonoBehaviour
    {
        [FormerlySerializedAs("zurStadtkarteButton")]
        [SerializeField] private Button cityMapButton;
        [SerializeField] private Text   levelTitleText;

        private void Awake()
        {
            if (cityMapButton == null)
                Debug.LogWarning("[LevelShellView] cityMapButton is not assigned.");
        }

        private void Start()
        {
            cityMapButton?.onClick.AddListener(OnCityMapClicked);
        }

        private void OnCityMapClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[LevelShellView] GameFlowController not found.");
                return;
            }
            GameFlowController.Instance.LoadCityMap();
        }

        private void OnDestroy()
        {
            cityMapButton?.onClick.RemoveListener(OnCityMapClicked);
        }
    }
}
