using System.Collections;
using LanguageGame.Application;
using LanguageGame.Presentation.Steps;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Leaderboard screen (overall + team modes) with manual refresh.</summary>
    public sealed class LeaderboardView : MonoBehaviour
    {
        private enum LeaderboardMode
        {
            Overall,
            Team,
        }

        private UIDocument _doc;

        private GameProgressApiClient _gameApi;

        private VisualElement _teamSummaryHost;

        private VisualElement _listHost;

        private Label _emptyLabel;

        private Button _modeOverallButton;

        private Button _modeTeamButton;

        private Button _refreshButton;

        private readonly LearningToolkitPauseChromeBinder _pauseChrome = new();

        private readonly LearningToolkitLoadingOverlay _loadingOverlay = new();

        private readonly LearningToolkitLoadErrorBanner _loadErrorBanner = new();

        private LeaderboardMode _mode = LeaderboardMode.Overall;

        private GameLeaderboardEnvelope _latest;

        private bool _fetchInFlight;

        private const string RefreshButtonLabel = "Aggiorna";

        private void Awake()
        {
            _doc = LearningToolkitBootstrap.SpawnUiDocument(this, "Screens/LeaderboardScreen");
            if (_doc == null)
            {
                Debug.LogError("[LeaderboardView] UI Toolkit bootstrap failed.");
                enabled = false;
                return;
            }

            AttachOverlays();
            LearningToolkitNavigationFeedback.RegisterPresentationDocument(_doc);

            VisualElement root = _doc.rootVisualElement;
            ToolkitNavigationScreenBinder.ApplyLeaderboardScreen(root);
            _teamSummaryHost = root.Q<VisualElement>("team-summary-host");
            _listHost = root.Q<VisualElement>("leaderboard-list-host");
            _emptyLabel = root.Q<Label>("empty-label");
            _modeOverallButton = root.Q<Button>("mode-overall-button");
            _modeTeamButton = root.Q<Button>("mode-team-button");
            _refreshButton = root.Q<Button>("refresh-button");

            if (!_pauseChrome.Bind(_doc, LearningToolkitChromeUx.LeaveToMainMenuLabel, OnLeaveToMainMenu))
            {
                Debug.LogError("[LeaderboardView] Pause chrome bind failed.");
                enabled = false;
                return;
            }

            _modeOverallButton?.RegisterCallback<ClickEvent>(_ => SetMode(LeaderboardMode.Overall));
            _modeTeamButton?.RegisterCallback<ClickEvent>(_ => SetMode(LeaderboardMode.Team));
            _refreshButton?.RegisterCallback<ClickEvent>(_ => OnRefreshClicked());

            // Drop UI Builder fixtures before the first API bind (panel chrome stays).
            ToolkitStepUx.ClearHost(_teamSummaryHost);
            ToolkitStepUx.ClearHost(_listHost);
            root.Q<VisualElement>("leaderboard-ui-builder-preview")?.RemoveFromHierarchy();
        }

        private void Start()
        {
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            SetMode(LeaderboardMode.Overall);
            StartCoroutine(LoadLeaderboardRoutine(showBlockingOverlay: true));
        }

        private void AttachOverlays()
        {
            VisualElement overlay = LearningToolkitBootstrap.ResolveOverlayPlane(_doc);
            if (overlay == null)
            {
                Debug.LogError("[LeaderboardView] overlay-plane missing.");
                return;
            }

            _loadingOverlay.Attach(overlay);
            _loadErrorBanner.Attach(overlay);
        }

        private void OnLeaveToMainMenu() => GameFlowController.Instance?.LoadMainMenu();

        private void OnRefreshClicked()
        {
            if (_fetchInFlight)
                return;

            StartCoroutine(LoadLeaderboardRoutine(showBlockingOverlay: false));
        }

        private void SetMode(LeaderboardMode mode)
        {
            _mode = mode;
            var overallActive = mode == LeaderboardMode.Overall;
            _modeOverallButton?.EnableInClassList("lg-btn--primary", overallActive);
            _modeOverallButton?.EnableInClassList("lg-btn--secondary", !overallActive);
            _modeTeamButton?.EnableInClassList("lg-btn--primary", !overallActive);
            _modeTeamButton?.EnableInClassList("lg-btn--secondary", overallActive);

            if (_teamSummaryHost != null)
                _teamSummaryHost.style.display =
                    mode == LeaderboardMode.Team ? DisplayStyle.Flex : DisplayStyle.None;

            if (_latest != null)
                RebindVisibleLists();
        }

        private IEnumerator LoadLeaderboardRoutine(bool showBlockingOverlay)
        {
            if (_gameApi == null)
            {
                _loadErrorBanner.Show(
                    "GameProgressApiClient was not found — add it to GameFlow or Retry.",
                    () => StartCoroutine(LoadLeaderboardRoutine(showBlockingOverlay: true)));
                yield break;
            }

            if (_fetchInFlight)
                yield break;

            _fetchInFlight = true;
            RefreshInteractable(false);
            _loadErrorBanner.Hide();

            if (showBlockingOverlay)
                _loadingOverlay.Show("Caricamento classifica…");
            else
                SetRefreshButtonBusy(true);

            GameLeaderboardEnvelope env = null;
            string err = string.Empty;

            yield return _gameApi.GetLeaderboard(
                e => env = e,
                m => err = m);

            _loadingOverlay.Hide();
            SetRefreshButtonBusy(false);
            _fetchInFlight = false;
            RefreshInteractable(true);

            if (env == null || !env.ok)
            {
                if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                {
                    GameFlowController.Instance?.LoadAuth();
                    yield break;
                }

                _loadErrorBanner.Show(
                    string.IsNullOrEmpty(err) ? "Impossibile caricare la classifica." : err,
                    () => StartCoroutine(LoadLeaderboardRoutine(showBlockingOverlay: true)));
                yield break;
            }

            _latest = env;
            BindTeamSummary(env.teams);
            RebindVisibleLists();
        }

        private void BindTeamSummary(GameLeaderboardTeamEntryDto[] teams)
        {
            if (_teamSummaryHost == null)
                return;

            ToolkitStepUx.ClearHost(_teamSummaryHost);
            if (teams == null || teams.Length == 0)
                return;

            foreach (var team in teams)
                ToolkitLeaderboardUx.TryAddTeamSummaryCard(_teamSummaryHost, team);
        }

        private void RebindVisibleLists()
        {
            if (_listHost == null || _latest == null)
                return;

            ToolkitStepUx.ClearHost(_listHost);

            var rows = _latest.overall;
            if (rows == null || rows.Length == 0)
            {
                ShowEmpty(true);
                return;
            }

            ShowEmpty(false);

            if (_mode == LeaderboardMode.Overall)
            {
                foreach (var row in rows)
                    ToolkitLeaderboardUx.TryAddPlayerRow(_listHost, row);
                return;
            }

            AppendTeamGroupedPlayerRows(rows, "blue");
            AppendTeamGroupedPlayerRows(rows, "red");
        }

        private void AppendTeamGroupedPlayerRows(GameLeaderboardPlayerEntryDto[] rows, string teamId)
        {
            var sectionRows = new System.Collections.Generic.List<GameLeaderboardPlayerEntryDto>();
            foreach (var row in rows)
            {
                if (row != null && row.team == teamId)
                    sectionRows.Add(row);
            }

            if (sectionRows.Count == 0)
                return;

            ToolkitLeaderboardUx.TryAddTeamSectionHeader(_listHost, FormatTeamLabel(teamId));
            foreach (var row in sectionRows)
                ToolkitLeaderboardUx.TryAddPlayerRow(_listHost, row);
        }

        private void SetRefreshButtonBusy(bool busy)
        {
            if (_refreshButton == null)
                return;

            _refreshButton.text = busy ? "Aggiornamento…" : RefreshButtonLabel;
        }

        private void ShowEmpty(bool visible)
        {
            if (_emptyLabel != null)
                _emptyLabel.style.display = visible ? DisplayStyle.Flex : DisplayStyle.None;
        }

        private static string FormatTeamLabel(string team) => LearningToolkitChromeUx.FormatTeamDisplayLabel(team);

        private void RefreshInteractable(bool idle)
        {
            _pauseChrome.SetPauseEnabled(idle);
            _refreshButton?.SetEnabled(idle);
            _modeOverallButton?.SetEnabled(idle);
            _modeTeamButton?.SetEnabled(idle);
        }

        private void OnDestroy()
        {
            if (_doc != null)
                LearningToolkitNavigationFeedback.UnregisterPresentationDocument(_doc);

            _pauseChrome.Destroy();
            _loadErrorBanner.Destroy();
            _loadingOverlay.Destroy();

            if (_doc != null)
                Destroy(_doc.gameObject);
        }
    }
}
