using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;
using LanguageGame.Domain;

namespace LanguageGame.Presentation
{
    public class CityMapView : MonoBehaviour
    {
        [SerializeField] private Button hauptmenueButton;

        [Header("Level Pins")]
        [SerializeField] private Button pinErrorSpotting;
        [SerializeField] private Button pinDragDrop;
        [SerializeField] private Button pinClozeText;
        [SerializeField] private Button pinMatching;
        [SerializeField] private Button pinMultipleChoice;
        [SerializeField] private Button pinFreeText;
        [SerializeField] private Button pinRelativeClause;

        private void Awake()
        {
            if (hauptmenueButton == null) Debug.LogWarning("[CityMapView] hauptmenueButton is not assigned.");
        }

        private void Start()
        {
            hauptmenueButton?.onClick.AddListener(OnHauptmenue);
            pinErrorSpotting?.onClick.AddListener(()  => OnPin(TaskType.ErrorSpotting));
            pinDragDrop?.onClick.AddListener(()       => OnPin(TaskType.DragDrop));
            pinClozeText?.onClick.AddListener(()      => OnPin(TaskType.ClozeText));
            pinMatching?.onClick.AddListener(()       => OnPin(TaskType.Matching));
            pinMultipleChoice?.onClick.AddListener(() => OnPin(TaskType.MultipleChoice));
            pinFreeText?.onClick.AddListener(()       => OnPin(TaskType.FreeText));
            pinRelativeClause?.onClick.AddListener(() => OnPin(TaskType.RelativeClause));
        }

        private void OnHauptmenue()
        {
            if (GameFlowController.Instance == null) { Debug.LogError("[CityMapView] GameFlowController not found."); return; }
            GameFlowController.Instance.LoadMainMenu();
        }

        private void OnPin(TaskType taskType)
        {
            if (GameFlowController.Instance == null) { Debug.LogError("[CityMapView] GameFlowController not found."); return; }
            GameFlowController.Instance.LoadLevel(taskType);
        }

        private void OnDestroy()
        {
            hauptmenueButton?.onClick.RemoveAllListeners();
            pinErrorSpotting?.onClick.RemoveAllListeners();
            pinDragDrop?.onClick.RemoveAllListeners();
            pinClozeText?.onClick.RemoveAllListeners();
            pinMatching?.onClick.RemoveAllListeners();
            pinMultipleChoice?.onClick.RemoveAllListeners();
            pinFreeText?.onClick.RemoveAllListeners();
            pinRelativeClause?.onClick.RemoveAllListeners();
        }
    }
}
