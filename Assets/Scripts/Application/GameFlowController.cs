using UnityEngine;
using UnityEngine.SceneManagement;

namespace LanguageGame.Application
{
    public class GameFlowController : MonoBehaviour
    {
        public static GameFlowController Instance { get; private set; }

        private const string SceneAuth = "Auth";
        private const string SceneMainMenu = "MainMenu";
        private const string SceneChapterOverview = "ChapterOverview";
        private const string SceneQuestOverview = "QuestOverview";
        private const string SceneQuest = "Quest";
        private const string SceneAvatarShop = "AvatarShop";

        private string _serverRunId;
        private string _serverQuestId;
        private string _serverQuestDisplayName;
        private GameQuestStepDto[] _serverSteps;
        private int _serverStepOrderIndex;
        private int _serverTaskOrderIndex;
        private int _totalPizzaSlices;
        private int _totalBackpackPieces;
        private string _selectedChapterId;
        private string _selectedChapterSlug;
        private string _selectedChapterDisplayName;
        private string _selectedChapterThemeJson;
        private GameQuestBootstrapDto[] _selectedChapterQuests;

        private enum AvatarShopReturnTarget
        {
            MainMenu,
            ChapterOverview
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
            ClearAllQuestState();
            LoadScene(SceneAuth);
        }

        public void LoadMainMenu()
        {
            ClearAllQuestState();
            LoadScene(SceneMainMenu);
        }

        public void LoadChapterOverview()
        {
            ClearAllQuestState();
            LoadScene(SceneChapterOverview);
        }

        public void LoadQuestOverview()
        {
            LoadScene(SceneQuestOverview);
        }

        public void SetSelectedChapter(GameChapterBootstrapDto chapter)
        {
            if (chapter == null)
                return;

            _selectedChapterId = chapter.id;
            _selectedChapterSlug = chapter.slug;
            _selectedChapterDisplayName = chapter.displayName;
            _selectedChapterThemeJson = chapter.themeJson;
            _selectedChapterQuests = chapter.quests;
        }

        public string SelectedChapterId => _selectedChapterId ?? string.Empty;
        public string SelectedChapterSlug => _selectedChapterSlug ?? string.Empty;
        public string SelectedChapterDisplayName => _selectedChapterDisplayName ?? string.Empty;
        public string SelectedChapterThemeJson => _selectedChapterThemeJson ?? string.Empty;
        public GameQuestBootstrapDto[] SelectedChapterQuests => _selectedChapterQuests;

        public void LoadAvatarShopFromMainMenu()
        {
            _avatarShopReturnTarget = AvatarShopReturnTarget.MainMenu;
            ClearAllQuestState();
            LoadScene(SceneAvatarShop);
        }

        public void LoadAvatarShopFromChapterOverview()
        {
            _avatarShopReturnTarget = AvatarShopReturnTarget.ChapterOverview;
            ClearAllQuestState();
            LoadScene(SceneAvatarShop);
        }

        public void ReturnFromAvatarShop()
        {
            if (_avatarShopReturnTarget == AvatarShopReturnTarget.ChapterOverview)
                LoadChapterOverview();
            else
                LoadMainMenu();
        }

        /// <summary>Opens the game scene for a server-backed quest run (steps + progression from API).</summary>
        public void BeginServerQuest(string runId, string questId, string displayName,
            GameQuestStepDto[] steps, int currentStepOrderIndex, int currentTaskOrderIndex,
            int totalPizzaSlices, int totalBackpackPieces)
        {
            if (string.IsNullOrEmpty(runId) || steps == null || steps.Length == 0)
            {
                Debug.LogError("[GameFlowController] Invalid server quest start payload.");
                LoadChapterOverview();
                return;
            }

            _serverRunId = runId;
            _serverQuestId = questId;
            _serverQuestDisplayName = displayName;
            _serverSteps = steps;
            _serverStepOrderIndex = Mathf.Clamp(currentStepOrderIndex, 0, steps.Length - 1);
            _serverTaskOrderIndex = Mathf.Max(0, currentTaskOrderIndex);
            _totalPizzaSlices = totalPizzaSlices;
            _totalBackpackPieces = Mathf.Max(0, totalBackpackPieces);
            LoadScene(SceneQuest);
        }

        public bool IsServerQuestActive => !string.IsNullOrEmpty(_serverRunId);

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
        public string ServerQuestId => _serverQuestId;

        public void ApplyServerTaskProgress(int newStepOrderIndex, int newTaskOrderIndex,
            int totalSlices, int totalBackpackPieces, bool questComplete)
        {
            _serverStepOrderIndex = Mathf.Max(0, newStepOrderIndex);
            _serverTaskOrderIndex = newTaskOrderIndex;
            _totalPizzaSlices = Mathf.Max(0, totalSlices);
            _totalBackpackPieces = Mathf.Max(0, totalBackpackPieces);
            if (questComplete)
                ClearServerQuestState();
        }

        {
            step = null;
            if (_serverSteps == null || _serverStepOrderIndex < 0 || _serverStepOrderIndex >= _serverSteps.Length)
                return false;
            step = _serverSteps[_serverStepOrderIndex];
            return true;
        }

        public bool TryGetCurrentServerTask(out GameQuestStepDto taskStep)
        {
            taskStep = null;
            if (!TryGetCurrentServerStep(out var step))
                return false;
            if (step == null || !step.isTask || string.IsNullOrEmpty(step.id))
                return false;
            taskStep = step;
            return true;
        }

        public int ServerCurrentStepNumberOneBased =>
            _serverSteps == null ? 0 : Mathf.Clamp(_serverStepOrderIndex + 1, 1, _serverSteps.Length);

        public int ServerStepCount => _serverSteps?.Length ?? 0;

        public int ServerCurrentTaskNumberOneBased =>
            Mathf.Max(0, _serverTaskOrderIndex + 1);

        public int ServerTaskCount => _serverSteps == null ? 0 : _serverSteps.Length;

        public string ServerQuestDisplayName => _serverQuestDisplayName ?? string.Empty;

        private void ClearAllQuestState()
        {
            ClearServerQuestState();
            ClearChapterSelection();
        }

        public void ClearServerQuestState()
        {
            _serverRunId = null;
            _serverQuestId = null;
            _serverQuestDisplayName = null;
            _serverSteps = null;
            _serverStepOrderIndex = 0;
            _serverTaskOrderIndex = 0;
        }

        public void ClearChapterSelection()
        {
            _selectedChapterId = null;
            _selectedChapterSlug = null;
            _selectedChapterDisplayName = null;
            _selectedChapterThemeJson = null;
            _selectedChapterQuests = null;
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
