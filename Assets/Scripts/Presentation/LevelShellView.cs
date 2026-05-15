using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class LevelShellView : MonoBehaviour
    {
        [SerializeField] private Button cityMapButton;
        [SerializeField] private Button nextTaskButton;
        [SerializeField] private Text levelTitleText;
        [SerializeField] private Text taskDetailText;

        private void Awake()
        {
            if (cityMapButton == null)
                Debug.LogWarning("[LevelShellView] cityMapButton is not assigned.");
            if (nextTaskButton == null)
                Debug.LogWarning("[LevelShellView] nextTaskButton is not assigned.");
        }

        private void Start()
        {
            cityMapButton?.onClick.AddListener(OnCityMapClicked);
            nextTaskButton?.onClick.AddListener(OnNextTaskClicked);
            RefreshTaskUi();
        }

        private void RefreshTaskUi()
        {
            var flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[LevelShellView] GameFlowController not found.");
                return;
            }

            if (!flow.TryGetCurrentTask(out var slot))
            {
                if (levelTitleText != null)
                    levelTitleText.text = "No active level";
                if (taskDetailText != null)
                    taskDetailText.text = string.Empty;
                return;
            }

            if (levelTitleText != null)
            {
                levelTitleText.text =
                    $"{flow.ActiveLevelDisplayName} — Task {flow.CurrentTaskNumberOneBased}/{flow.ActiveLevelTaskCount}";
            }

            if (taskDetailText != null)
            {
                var label = string.IsNullOrEmpty(slot.placeholderLabel)
                    ? "(placeholder)"
                    : slot.placeholderLabel;
                taskDetailText.text = $"Type: {slot.taskType}\n{label}";
            }
        }

        private void OnNextTaskClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[LevelShellView] GameFlowController not found.");
                return;
            }

            if (GameFlowController.Instance.AdvanceTask())
                GameFlowController.Instance.LoadCityMap();
            else
                RefreshTaskUi();
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
            nextTaskButton?.onClick.RemoveListener(OnNextTaskClicked);
        }
    }
}
