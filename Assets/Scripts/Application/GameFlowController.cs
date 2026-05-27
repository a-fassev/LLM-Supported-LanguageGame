using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace LanguageGame.Application
{
    public class GameFlowController : MonoBehaviour
    {
        public static GameFlowController Instance { get; private set; }

        /// <summary>Fired when a navigation method was called while a scene transition was already in progress.</summary>
        public static event Action SceneTransitionSuppressed;

        private bool _sceneTransitionInProgress;

        private const string SceneAuth = "Auth";
        private const string SceneMainMenu = "MainMenu";
        private const string SceneChapterOverview = "ChapterOverview";
        private const string SceneQuestOverview = "QuestOverview";
        private const string SceneQuest = "Quest";
        private const string SceneAvatarShop = "AvatarShop";
        private const string SceneLeaderboard = "Leaderboard";

        private string _serverRunId;
        private string _serverQuestId;
        private string _serverQuestDisplayName;
        private string _serverQuestMetaJson;
        private QuestMetaPayloadDto _serverQuestMeta = new QuestMetaPayloadDto();
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

        public bool IsSceneTransitionInProgress => _sceneTransitionInProgress;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            SceneManager.sceneLoaded += OnSceneLoaded;
        }

        private void OnDestroy()
        {
            if (Instance == this)
                SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        /// <summary>Clears the navigation lock when our <see cref="SceneManager.LoadScene(string, LoadSceneMode)"/> Single load completes.</summary>
        /// <remarks>Do not clear on <see cref="LoadSceneMode.Additive"/> loads or unrelated tooling loads.</remarks>
        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            if (mode != LoadSceneMode.Single)
                return;

            _sceneTransitionInProgress = false;
        }

        public void LoadAuth()
        {
            if (!TryBeginTransitionOrNotify())
                return;

            GameSessionStateStore.Clear();
            ClearAllQuestState();
            BeginSceneTransition(SceneAuth);
        }

        public void LoadMainMenu()
        {
            if (!TryBeginTransitionOrNotify())
                return;

            ClearAllQuestState();
            BeginSceneTransition(SceneMainMenu);
        }

        public void LoadChapterOverview()
        {
            if (!TryBeginTransitionOrNotify())
                return;

            ClearAllQuestState();
            BeginSceneTransition(SceneChapterOverview);
        }

        public void LoadLeaderboard()
        {
            if (!TryBeginTransitionOrNotify())
                return;

            ClearAllQuestState();
            BeginSceneTransition(SceneLeaderboard);
        }

        public void LoadQuestOverview()
        {
            if (!TryBeginTransitionOrNotify())
                return;

            BeginSceneTransition(SceneQuestOverview);
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

        public void LoadAvatarShopFromChapterOverview()
        {
            if (!TryBeginTransitionOrNotify())
                return;

            ClearAllQuestState();
            BeginSceneTransition(SceneAvatarShop);
        }

        public void ReturnFromAvatarShop()
        {
            LoadChapterOverview();
        }

        /// <summary>Opens the game scene for a server-backed quest run (steps + progression from API).</summary>
        public void BeginServerQuest(string runId, string questId, string displayName,
            string questMetaJson,
            GameQuestStepDto[] steps, int currentStepOrderIndex, int currentTaskOrderIndex,
            int totalPizzaSlices, int totalBackpackPieces)
        {
            if (string.IsNullOrEmpty(runId) || steps == null || steps.Length == 0)
            {
                Debug.LogError("[GameFlowController] Invalid server quest start payload.");
                LoadChapterOverview();
                return;
            }

            if (!TryBeginTransitionOrNotify())
                return;

            _serverRunId = runId;
            _serverQuestId = questId;
            _serverQuestDisplayName = displayName;
            _serverQuestMetaJson = questMetaJson ?? string.Empty;
            _serverQuestMeta = QuestMetaPayloadParser.Parse(_serverQuestMetaJson);
            _serverSteps = steps;
            _serverStepOrderIndex = Mathf.Clamp(currentStepOrderIndex, 0, steps.Length - 1);
            _serverTaskOrderIndex = Mathf.Max(0, currentTaskOrderIndex);
            _totalPizzaSlices = totalPizzaSlices;
            _totalBackpackPieces = Mathf.Max(0, totalBackpackPieces);
            BeginSceneTransition(SceneQuest);
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

        public string ServerQuestMetaJson => _serverQuestMetaJson ?? string.Empty;

        public QuestMetaPayloadDto ServerQuestMeta => _serverQuestMeta ?? new QuestMetaPayloadDto();

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

        public bool TryGetCurrentServerStep(out GameQuestStepDto step)
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

        /// <summary>1-based ordinal of current step among all steps (tasks + cutscenes).</summary>
        public int ServerCurrentStepNumberOneBased =>
            _serverSteps == null ? 0 : Mathf.Clamp(_serverStepOrderIndex + 1, 1, _serverSteps.Length);

        /// <summary>Total ordered steps loaded for this quest run (tasks and cutscenes).</summary>
        public int ServerStepCount => _serverSteps?.Length ?? 0;

        /// <summary>Number of playable task steps in this quest payload (excludes cutscene steps).</summary>
        public int ServerQualifiedTaskStepCount => CountTaskOnlySteps(_serverSteps);

        public string ServerQuestDisplayName => _serverQuestDisplayName ?? string.Empty;

        private static int CountTaskOnlySteps(GameQuestStepDto[] steps)
        {
            if (steps == null || steps.Length == 0)
                return 0;

            var n = 0;
            foreach (var s in steps)
            {
                if (s != null && s.isTask)
                    n++;
            }

            return n;
        }

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
            _serverQuestMetaJson = null;
            _serverQuestMeta = new QuestMetaPayloadDto();
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

        private bool TryBeginTransitionOrNotify()
        {
            if (_sceneTransitionInProgress)
            {
                Debug.LogWarning("[GameFlowController] Scene load ignored — transition already in progress.");
                SceneTransitionSuppressed?.Invoke();
                return false;
            }

            return true;
        }

        private void BeginSceneTransition(string sceneName)
        {
            var target = string.IsNullOrEmpty(sceneName) ? SceneAuth : sceneName;
            if (string.IsNullOrEmpty(sceneName))
                Debug.LogError("[GameFlowController] Scene name empty. Falling back to Auth.");

            _sceneTransitionInProgress = true;
            StartCoroutine(SceneTransitionWatchdogCoroutine(target));
            SceneManager.LoadScene(target, LoadSceneMode.Single);
        }

        private IEnumerator SceneTransitionWatchdogCoroutine(string expectedSceneName)
        {
            const float timeoutSeconds = 10f;
            var elapsed = 0f;
            while (elapsed < timeoutSeconds)
            {
                if (!_sceneTransitionInProgress)
                    yield break;
                elapsed += Time.unscaledDeltaTime;
                yield return null;
            }

            if (!_sceneTransitionInProgress)
                yield break;

            Debug.LogError(
                "[GameFlowController] Scene transition watchdog timed out while loading '" + expectedSceneName +
                "'. Resetting navigation lock.");
            _sceneTransitionInProgress = false;
        }
    }
}
