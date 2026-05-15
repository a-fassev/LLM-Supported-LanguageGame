using UnityEngine;
using UnityEngine.SceneManagement;
using LanguageGame.Domain;

namespace LanguageGame.Application
{
    public class GameFlowController : MonoBehaviour
    {
        public static GameFlowController Instance { get; private set; }

        private const string SceneMainMenu = "MainMenu";
        private const string SceneCityMap = "CityMap";
        private const string SceneLevel = "Level";

        private LevelConfig _activeLevel;
        private int _taskIndex;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void LoadMainMenu()
        {
            ClearActiveLevel();
            LoadScene(SceneMainMenu);
        }

        public void LoadCityMap()
        {
            ClearActiveLevel();
            LoadScene(SceneCityMap);
        }

        /// <summary>
        /// Opens the reusable level scene with the given configuration (task sequence).
        /// </summary>
        public void LoadLevel(LevelConfig levelConfig)
        {
            if (levelConfig == null || levelConfig.TaskCount == 0)
            {
                Debug.LogError("[GameFlowController] LevelConfig missing or has no tasks. Falling back to MainMenu.");
                LoadMainMenu();
                return;
            }

            _activeLevel = levelConfig;
            _taskIndex = 0;
            LoadScene(SceneLevel);
        }

        public bool TryGetCurrentTask(out TaskSlot slot)
        {
            slot = default;
            return _activeLevel != null && _activeLevel.TryGetTask(_taskIndex, out slot);
        }

        /// <summary>
        /// Moves to the next task. Returns true when the level is finished (caller should leave the level scene).
        /// </summary>
        public bool AdvanceTask()
        {
            if (_activeLevel == null)
                return true;

            _taskIndex++;
            if (_taskIndex >= _activeLevel.TaskCount)
            {
                ClearActiveLevel();
                return true;
            }

            return false;
        }

        public int CurrentTaskNumberOneBased => _activeLevel == null ? 0 : Mathf.Clamp(_taskIndex + 1, 1, _activeLevel.TaskCount);

        public int ActiveLevelTaskCount => _activeLevel?.TaskCount ?? 0;

        public string ActiveLevelDisplayName => _activeLevel != null ? _activeLevel.DisplayName : string.Empty;

        private void ClearActiveLevel()
        {
            _activeLevel = null;
            _taskIndex = 0;
        }

        private void LoadScene(string sceneName)
        {
            if (string.IsNullOrEmpty(sceneName))
            {
                Debug.LogError("[GameFlowController] Scene name empty. Falling back to MainMenu.");
                SceneManager.LoadScene(SceneMainMenu, LoadSceneMode.Single);
                return;
            }

            SceneManager.LoadScene(sceneName, LoadSceneMode.Single);
        }
    }
}
