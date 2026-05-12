using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class LevelShellView : MonoBehaviour
    {
        [SerializeField] private Button zurStadtkarteButton;
        [SerializeField] private Text   levelTitleText;

        private void Awake()
        {
            if (zurStadtkarteButton == null)
                Debug.LogWarning("[LevelShellView] zurStadtkarteButton is not assigned.");
        }

        private void Start()
        {
            zurStadtkarteButton?.onClick.AddListener(OnZurStadtkarte);
        }

        private void OnZurStadtkarte()
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
            zurStadtkarteButton?.onClick.RemoveListener(OnZurStadtkarte);
        }
    }
}
