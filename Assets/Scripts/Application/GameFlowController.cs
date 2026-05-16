using UnityEngine;
using UnityEngine.SceneManagement;
using LanguageGame.Domain;

namespace LanguageGame.Application
{
    public class GameFlowController : MonoBehaviour
    {
        public static GameFlowController Instance { get; private set; }

        private const string SceneAuth = "Auth";
        private const string SceneMainMenu = "MainMenu";
        private const string SceneCityMap = "CityMap";
        private const string SceneLevel = "Level";
        private const string SceneAvatarShop = "AvatarShop";

        /// <summary>Legacy ScriptableObject level (optional; city map uses server levels).</summary>
        private LevelConfig _activeLevel;

        private int _taskIndex;

        private string _serverRunId;
        private string _serverLevelId;
        private string _serverLevelDisplayName;
        private GameTaskBootstrapDto[] _serverTasks;
        private int _serverTaskOrderIndex;
        private int _totalPizzaSlices;
        private int _totalBackpackPieces;

        private enum AvatarShopReturnTarget
        {
            MainMenu,
            CityMap
        }

        private AvatarShopReturnTarget _avatarShopReturnTarget = AvatarShopReturnTarget.MainMenu;

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

        public void LoadAuth()
        {
            GameSessionStateStore.Clear();
            ClearAllLevelState();
            LoadScene(SceneAuth);
        }

        public void LoadMainMenu()
        {
            ClearAllLevelState();
            LoadScene(SceneMainMenu);
        }

        public void LoadCityMap()
        {
            ClearAllLevelState();
            LoadScene(SceneCityMap);
        }

        public void LoadAvatarShopFromMainMenu()
        {
            _avatarShopReturnTarget = AvatarShopReturnTarget.MainMenu;
            ClearAllLevelState();
            LoadScene(SceneAvatarShop);
        }

        public void LoadAvatarShopFromCityMap()
        {
            _avatarShopReturnTarget = AvatarShopReturnTarget.CityMap;
            ClearAllLevelState();
            LoadScene(SceneAvatarShop);
        }

        public void ReturnFromAvatarShop()
        {
            if (_avatarShopReturnTarget == AvatarShopReturnTarget.CityMap)
                LoadCityMap();
            else
                LoadMainMenu();
        }

        /// <summary>Opens the reusable level scene with a local <see cref="LevelConfig"/> (legacy / tools).</summary>
        public void LoadLevel(LevelConfig levelConfig)
        {
            if (levelConfig == null || levelConfig.TaskCount == 0)
            {
                Debug.LogError("[GameFlowController] LevelConfig missing or has no tasks. Falling back to MainMenu.");
                LoadMainMenu();
                return;
            }

            ClearServerLevelState();
            _activeLevel = levelConfig;
            _taskIndex = 0;
            LoadScene(SceneLevel);
        }

        /// <summary>Opens the level scene for a server-backed run (tasks + progression from API).</summary>
        public void BeginServerLevel(string runId, string levelId, string displayName,
            GameTaskBootstrapDto[] tasks, int currentTaskOrderIndex, int totalPizzaSlices,
            int totalBackpackPieces)
        {
            if (string.IsNullOrEmpty(runId) || tasks == null || tasks.Length == 0)
            {
                Debug.LogError("[GameFlowController] Invalid server level start payload.");
                LoadCityMap();
                return;
            }

            ClearLegacyLevelState();
            _serverRunId = runId;
            _serverLevelId = levelId;
            _serverLevelDisplayName = displayName;
            _serverTasks = tasks;
            _serverTaskOrderIndex = Mathf.Clamp(currentTaskOrderIndex, 0, tasks.Length - 1);
            _totalPizzaSlices = totalPizzaSlices;
            _totalBackpackPieces = Mathf.Max(0, totalBackpackPieces);
            LoadScene(SceneLevel);
        }

        public bool IsServerLevelActive => !string.IsNullOrEmpty(_serverRunId);

        public int TotalPizzaSlices => _totalPizzaSlices;

        public void SetTotalPizzaSlices(int value)
        {
            _totalPizzaSlices = Mathf.Max(0, value);
        }

        public int TotalBackpackPieces => _totalBackpackPieces;

        public void SetTotalBackpackPieces(int value)
        {
            _totalBackpackPieces = Mathf.Max(0, value);
        }

        public string ServerRunId => _serverRunId;

        public void ApplyServerTaskProgress(int newTaskOrderIndex, int totalSlices,
            int totalBackpackPieces, bool levelComplete)
        {
            _serverTaskOrderIndex = newTaskOrderIndex;
            _totalPizzaSlices = Mathf.Max(0, totalSlices);
            _totalBackpackPieces = Mathf.Max(0, totalBackpackPieces);
            if (levelComplete)
                ClearServerLevelState();
        }

        public bool TryGetCurrentTask(out TaskSlot slot)
        {
            slot = default;
            return _activeLevel != null && _activeLevel.TryGetTask(_taskIndex, out slot);
        }

        public bool TryGetCurrentServerTask(out GameTaskBootstrapDto task)
        {
            task = null;
            if (_serverTasks == null || _serverTaskOrderIndex < 0 || _serverTaskOrderIndex >= _serverTasks.Length)
                return false;
            task = _serverTasks[_serverTaskOrderIndex];
            return true;
        }

        /// <summary>Moves to the next legacy task. Returns true when the level is finished.</summary>
        public bool AdvanceTask()
        {
            if (_activeLevel == null)
                return true;

            _taskIndex++;
            if (_taskIndex >= _activeLevel.TaskCount)
            {
                ClearLegacyLevelState();
                return true;
            }

            return false;
        }

        public int CurrentTaskNumberOneBased =>
            _activeLevel == null ? 0 : Mathf.Clamp(_taskIndex + 1, 1, _activeLevel.TaskCount);

        public int ActiveLevelTaskCount => _activeLevel?.TaskCount ?? 0;

        public string ActiveLevelDisplayName => _activeLevel != null ? _activeLevel.DisplayName : string.Empty;

        public int ServerCurrentTaskNumberOneBased =>
            _serverTasks == null ? 0 : Mathf.Clamp(_serverTaskOrderIndex + 1, 1, _serverTasks.Length);

        public int ServerTaskCount => _serverTasks?.Length ?? 0;

        public string ServerLevelDisplayName => _serverLevelDisplayName ?? string.Empty;

        private void ClearAllLevelState()
        {
            ClearLegacyLevelState();
            ClearServerLevelState();
        }

        private void ClearLegacyLevelState()
        {
            _activeLevel = null;
            _taskIndex = 0;
        }

        public void ClearServerLevelState()
        {
            _serverRunId = null;
            _serverLevelId = null;
            _serverLevelDisplayName = null;
            _serverTasks = null;
            _serverTaskOrderIndex = 0;
        }

        private void LoadScene(string sceneName)
        {
            if (string.IsNullOrEmpty(sceneName))
            {
                Debug.LogError("[GameFlowController] Scene name empty. Falling back to Auth.");
                SceneManager.LoadScene(SceneAuth, LoadSceneMode.Single);
                return;
            }

            SceneManager.LoadScene(sceneName, LoadSceneMode.Single);
        }
    }
}
