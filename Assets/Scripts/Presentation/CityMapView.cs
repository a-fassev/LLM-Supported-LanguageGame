using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;
using LanguageGame.Domain;

namespace LanguageGame.Presentation
{
    public class CityMapView : MonoBehaviour
    {
        [SerializeField] private Button mainMenuButton;

        [Header("Test level entries (assign LevelConfig assets and buttons)")]
        [SerializeField] private LevelConfig testLevelA;
        [SerializeField] private Button levelButtonA;
        [SerializeField] private LevelConfig testLevelB;
        [SerializeField] private Button levelButtonB;
        [SerializeField] private LevelConfig testLevelC;
        [SerializeField] private Button levelButtonC;

        private void Awake()
        {
            if (mainMenuButton == null) Debug.LogWarning("[CityMapView] mainMenuButton is not assigned.");
        }

        private void Start()
        {
            mainMenuButton?.onClick.AddListener(OnMainMenuClicked);
            levelButtonA?.onClick.AddListener(() => OnLevelEntry(testLevelA));
            levelButtonB?.onClick.AddListener(() => OnLevelEntry(testLevelB));
            levelButtonC?.onClick.AddListener(() => OnLevelEntry(testLevelC));
        }

        private void OnMainMenuClicked()
        {
            if (GameFlowController.Instance == null) { Debug.LogError("[CityMapView] GameFlowController not found."); return; }
            GameFlowController.Instance.LoadMainMenu();
        }

        private void OnLevelEntry(LevelConfig config)
        {
            if (GameFlowController.Instance == null) { Debug.LogError("[CityMapView] GameFlowController not found."); return; }
            if (config == null)
            {
                Debug.LogWarning("[CityMapView] LevelConfig is not assigned for this button.");
                return;
            }

            GameFlowController.Instance.LoadLevel(config);
        }

        private void OnDestroy()
        {
            mainMenuButton?.onClick.RemoveAllListeners();
            levelButtonA?.onClick.RemoveAllListeners();
            levelButtonB?.onClick.RemoveAllListeners();
            levelButtonC?.onClick.RemoveAllListeners();
        }
    }
}
