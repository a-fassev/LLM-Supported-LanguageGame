using System;
using System.Collections;
using System.Collections.Generic;
using LanguageGame.Application;
using LanguageGame.Presentation.Steps;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    public sealed class QuestOverviewView : MonoBehaviour
    {
        private UIDocument _doc;

        private Label _pageTitleText;

        private VisualElement _questListHost;

        private readonly WalletHudBinder _walletHud = new();

        private readonly LearningToolkitPauseChromeBinder _pauseChrome = new();

        private readonly List<QuestRowUi> _questRows = new();

        private GameProgressApiClient _gameApi;

        private readonly LearningToolkitLoadErrorBanner _loadErrorBanner = new LearningToolkitLoadErrorBanner();

        private readonly LearningToolkitLoadingOverlay _loadingOverlay = new LearningToolkitLoadingOverlay();

        private readonly LearningToolkitUnlockModal _unlockModal = new LearningToolkitUnlockModal();

        private bool _startingQuest;

        private bool _bootstrapRefreshInFlight;

        private sealed class QuestRowUi
        {
            public Button Button;
            public Label Title;
            public Label Chip;
            public GameQuestBootstrapDto Quest;
        }

        private void Awake()
        {
            _doc = LearningToolkitBootstrap.SpawnUiDocument(this, "Screens/QuestOverviewScreen");
            if (_doc == null)
            {
                Debug.LogError("[QuestOverviewView] UI Toolkit bootstrap failed — check Resources paths and PanelSettings.");
                enabled = false;
                return;
            }

            VisualElement overlayPlane = LearningToolkitBootstrap.ResolveOverlayPlane(_doc);
            if (overlayPlane == null)
            {
                Debug.LogError("[QuestOverviewView] overlay-plane missing in UI definition.");
            }
            else
            {
                _loadErrorBanner.Attach(overlayPlane);
                _loadingOverlay.Attach(overlayPlane);
                _unlockModal.Attach(overlayPlane);
            }

            LearningToolkitNavigationFeedback.RegisterPresentationDocument(_doc);

            VisualElement root = _doc.rootVisualElement;
            ToolkitNavigationScreenBinder.ApplyQuestOverviewScreen(root);
            _pageTitleText = ToolkitNavigationScreenBinder.ResolveNavigationPageTitleLabel(root);
            if (_pageTitleText == null)
            {
                Debug.LogError("[QuestOverviewView] title-label missing in UI definition.");
                enabled = false;
                return;
            }

            _questListHost = root.Q<VisualElement>("quest-list-host");
            if (_questListHost == null)
            {
                Debug.LogError("[QuestOverviewView] quest-list-host missing in UI definition.");
                enabled = false;
                return;
            }

            if (!_walletHud.Bind(_doc))
            {
                Debug.LogError("[QuestOverviewView] Wallet HUD bind failed.");
                enabled = false;
                return;
            }

            if (!_pauseChrome.Bind(_doc, LearningToolkitChromeUx.LeaveToChapterOverviewLabel, OnLeaveToChapterOverview))
            {
                Debug.LogError("[QuestOverviewView] Pause chrome bind failed.");
                enabled = false;
                return;
            }
        }

        private void Start()
        {
            GameFlowController flow = GameFlowController.Instance;
            if (flow != null)
                ChapterThemeRuntime.Apply(flow.SelectedChapterThemeJson);

            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            StartCoroutine(EnsureBootstrapThenRefresh());
        }

        private void OnEnable()
        {
            _walletHud.Refresh();

            if (_bootstrapRefreshInFlight || _doc == null || !enabled)
                return;

            if (_gameApi == null)
                _gameApi = FindAnyObjectByType<GameProgressApiClient>();

            if (_gameApi == null)
                return;

            if (!GameSessionStateStore.IsBootstrapFresh(GameSessionStateStore.DefaultBootstrapFreshSeconds))
                StartCoroutine(EnsureBootstrapThenRefresh());
        }

        private IEnumerator EnsureBootstrapThenRefresh()
        {
            if (_bootstrapRefreshInFlight)
                yield break;

            _bootstrapRefreshInFlight = true;

            if (_gameApi == null)
            {
                Debug.LogWarning("[QuestOverviewView] GameProgressApiClient not found.");

                _loadErrorBanner.Show(
                    "GameProgressApiClient non trovato nella scena — aggiungilo a GameFlow o riprova.",
                    RestartBootstrapRoutine);
                _bootstrapRefreshInFlight = false;
                yield break;
            }

            bool hasSnapshot = GameSessionStateStore.TryGetBootstrapSnapshot(out _);
            bool needBootstrap =
                !hasSnapshot || !GameSessionStateStore.IsBootstrapFresh(GameSessionStateStore.DefaultBootstrapFreshSeconds);

            if (needBootstrap)
            {
                var useCase = new LoadGameBootstrapUseCase(_gameApi);
                GameBootstrapEnvelope env = null;
                string err = string.Empty;

                _loadingOverlay.Show("Caricamento missioni…");
                yield return useCase.Run(e => env = e, m => err = m);
                _loadingOverlay.Hide();

                if (env == null || !env.ok)
                {
                    if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                    {
                        GameFlowController.Instance?.LoadAuth();
                        _bootstrapRefreshInFlight = false;
                        yield break;
                    }

                    _loadErrorBanner.Show(
                        string.IsNullOrEmpty(err) ? "Impossibile caricare le missioni." : err,
                        RestartBootstrapRoutine);
                    _bootstrapRefreshInFlight = false;
                    yield break;
                }

                _loadErrorBanner.Hide();
            }

            SyncSelectedChapterFromBootstrap();
            RefreshQuestSlots();
            _bootstrapRefreshInFlight = false;
        }

        private void RestartBootstrapRoutine()
        {
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            StartCoroutine(EnsureBootstrapThenRefresh());
        }

        private static void SyncSelectedChapterFromBootstrap()
        {
            GameFlowController flow = GameFlowController.Instance;
            if (flow == null)
                return;

            if (!GameSessionStateStore.TryGetBootstrapSnapshot(out var bootstrap) || bootstrap?.chapters == null)
                return;

            var chapterId = flow.SelectedChapterId;
            if (string.IsNullOrEmpty(chapterId))
                return;

            foreach (GameChapterBootstrapDto chapter in bootstrap.chapters)
            {
                if (chapter == null || chapter.id != chapterId)
                    continue;

                flow.SetSelectedChapter(chapter);
                if (!string.IsNullOrEmpty(chapter.themeJson))
                    ChapterThemeRuntime.Apply(chapter.themeJson);
                return;
            }
        }

        private void RefreshQuestSlots()
        {
            GameFlowController flow = GameFlowController.Instance;
            if (flow == null)
            {
                DisableQuestSlots("—");

                _loadErrorBanner.Show(
                    "Navigazione non disponibile. Torna indietro o riavvia da Accesso.",
                    RefreshQuestSlots);

                return;
            }

            _loadErrorBanner.Hide();

            ApplyPageTitle(flow.SelectedChapterDisplayName);

            _walletHud.Refresh();

            RebuildQuestList(flow.SelectedChapterQuests);
            ShowPendingQuestOverviewNoticeIfAny();
        }

        private void ShowPendingQuestOverviewNoticeIfAny()
        {
            if (!GameSessionStateStore.TryConsumeQuestOverviewNotice(out var notice))
                return;

            _unlockModal.Show("Missioni del capitolo", notice);
        }

        private void DisableQuestSlots(string placeholderTitle)
        {
            ApplyPageTitle(placeholderTitle);
            ClearQuestList();
        }

        private void ApplyPageTitle(string chapterDisplayName)
        {
            if (_pageTitleText == null)
                return;

            var chapter = chapterDisplayName?.Trim();
            _pageTitleText.text = string.IsNullOrEmpty(chapter) || chapter == "—"
                ? "Missioni del capitolo"
                : chapter;
        }

        private void ClearQuestList()
        {
            _questRows.Clear();
            if (_questListHost != null)
                ToolkitStepUx.ClearHost(_questListHost);
        }

        private void RebuildQuestList(GameQuestBootstrapDto[] quests)
        {
            ClearQuestList();
            if (_questListHost == null)
                return;

            if (quests == null || quests.Length == 0)
                return;

            for (var idx = 0; idx < quests.Length; idx++)
            {
                GameQuestBootstrapDto quest = quests[idx];
                if (quest == null)
                    continue;

                QuestRowUi row = CreateQuestRow(quest, idx);
                _questRows.Add(row);
                _questListHost.Add(row.Button);
            }
        }

        private QuestRowUi CreateQuestRow(GameQuestBootstrapDto quest, int idx)
        {
            if (!TryInstantiateQuestRowPart(idx, out Button btn, out Label title, out Label chip))
                return BuildQuestRowFallback(quest, idx);

            var row = new QuestRowUi { Button = btn, Title = title, Chip = chip, Quest = quest };
            ApplyQuestRowState(row);
            btn.clicked += () => OnQuestClicked(quest);
            return row;
        }

        private static bool TryInstantiateQuestRowPart(int idx, out Button btn, out Label title, out Label chip)
        {
            btn = null;
            title = null;
            chip = null;

            VisualElement root = ToolkitStepUx.InstantiatePart(
                ToolkitNavigationTemplatePaths.NavigationQuestRowPart,
                "navigation-quest-row-button");
            if (root is not Button partButton)
                return false;

            btn = partButton;
            btn.name = $"quest-row-{idx}";
            title = btn.Q<Label>("quest-title-label");
            chip = btn.Q<Label>("quest-chip-label");
            return title != null && chip != null;
        }

        private QuestRowUi BuildQuestRowFallback(GameQuestBootstrapDto quest, int idx)
        {
            var btn = new Button { name = $"quest-row-{idx}" };
            btn.AddToClassList("lg-list-row-button");

            var title = new Label { name = $"quest-title-{idx}" };
            title.AddToClassList("lg-list-row-text");
            title.AddToClassList("lg-text-body-lg");
            title.AddToClassList("lg-text-muted");

            var chip = new Label { name = $"quest-chip-{idx}" };
            chip.AddToClassList("lg-chip");
            chip.AddToClassList("lg-chip--lock");
            chip.AddToClassList("lg-text-muted");
            chip.style.display = DisplayStyle.None;

            btn.Add(title);
            btn.Add(chip);

            var row = new QuestRowUi { Button = btn, Title = title, Chip = chip, Quest = quest };
            ApplyQuestRowState(row);
            btn.clicked += () => OnQuestClicked(quest);
            return row;
        }

        private void ApplyQuestRowState(QuestRowUi row)
        {
            if (row?.Button == null || row.Quest == null)
                return;

            GameQuestBootstrapDto quest = row.Quest;
            var isCompleted = quest.hasCompletedAnyRun;
            var canStart = !_startingQuest && quest.isUnlocked && !isCompleted;
            row.Button.SetEnabled(canStart);

            if (row.Title != null)
                row.Title.text = quest.displayName ?? string.Empty;

            if (isCompleted)
            {
                SetChip(row.Chip, DisplayStyle.Flex, "Fatto");
                return;
            }

            SetChip(row.Chip,
                quest.isUnlocked ? DisplayStyle.None : DisplayStyle.Flex,
                quest.isUnlocked ? string.Empty : "Presto");
        }

        private static void SetChip(Label chip, DisplayStyle visibility, string text)
        {
            if (chip == null)
                return;

            chip.text = text;
            chip.style.display = visibility;
        }

        private void RefreshQuestRowStates()
        {
            for (var i = 0; i < _questRows.Count; i++)
                ApplyQuestRowState(_questRows[i]);
        }

        private void OnQuestClicked(GameQuestBootstrapDto quest)
        {
            if (_startingQuest || quest == null)
                return;

            GameFlowController flow = GameFlowController.Instance;
            if (flow == null)
            {
                RefreshQuestSlots();
                return;
            }

            if (quest.hasCompletedAnyRun)
            {
                _unlockModal.Show("Missione già completata", "Questa missione può essere giocata una sola volta.");
                return;
            }

            if (!quest.isUnlocked)
            {
                string hint = string.IsNullOrEmpty(quest.unlockHint)
                    ? "Completa le missioni precedenti per sbloccare questa!"
                    : quest.unlockHint;

                _unlockModal.Show("Missione ancora bloccata", hint);
                return;
            }

            if (_gameApi == null)
                _gameApi = FindAnyObjectByType<GameProgressApiClient>();

            if (_gameApi == null)
            {
                Debug.LogError("[QuestOverviewView] Cannot start quest: GameProgressApiClient missing.");

                _loadErrorBanner.Show(
                    "GameProgressApiClient mancante — aggiungilo a GameFlow e riprova.",
                    RetryFindApiThenRefreshSlots);
                return;
            }

            StartCoroutine(StartQuestRoutine(quest));
        }

        private void RetryFindApiThenRefreshSlots()
        {
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            RefreshQuestSlots();
        }

        private IEnumerator StartQuestRoutine(GameQuestBootstrapDto quest)
        {
            _startingQuest = true;
            RefreshQuestRowStates();

            _loadingOverlay.Show("Avvio missione…");

            var useCase = new StartQuestRunUseCase(_gameApi);
            GameStartQuestEnvelope started = null;
            string err = string.Empty;
            yield return useCase.Run(quest.id, s => started = s, m => err = m);

            _loadingOverlay.Hide();

            if (started == null || !started.ok)
            {
                _startingQuest = false;
                RefreshQuestRowStates();
                string message = string.IsNullOrEmpty(err)
                    ? "Impossibile avviare questa missione."
                    : err;

                if (!string.IsNullOrEmpty(err) &&
                    err.IndexOf("quest_already_completed", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    _unlockModal.Show("Missione già completata", "Questa missione può essere giocata una sola volta.");
                    yield return RefreshAfterQuestStateChange();
                    yield break;
                }

                if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                {
                    GameFlowController.Instance?.LoadAuth();
                    yield break;
                }

                _loadErrorBanner.Show(message, RefreshQuestSlots);
                yield break;
            }

            _loadErrorBanner.Hide();

            GameFlowController flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[QuestOverviewView] Quest bootstrap succeeded but GameFlowController is missing.");

                _startingQuest = false;
                RefreshQuestRowStates();

                _loadErrorBanner.Show(
                    "Dati missione ricevuti, ma la navigazione manca — torna ai capitoli e riprova.",
                    RefreshQuestSlots);
                yield break;
            }

            flow.SetTotalPizzaSlices(started.totalSlices);
            flow.SetTotalBackpackPieces(started.totalBackpackPieces);

            _startingQuest = false;

            flow.BeginServerQuest(
                started.runId,
                started.questId,
                started.displayName,
                started.metaJson,
                started.steps,
                started.currentStepOrderIndex,
                started.currentTaskOrderIndex,
                started.totalSlices,
                started.totalBackpackPieces);

            RefreshQuestRowStates();
        }

        /// <summary>Reload bootstrap after a quest state change so list chips reflect server truth.</summary>
        private IEnumerator RefreshAfterQuestStateChange()
        {
            if (_gameApi == null)
            {
                RefreshQuestSlots();
                yield break;
            }

            var useCase = new LoadGameBootstrapUseCase(_gameApi);
            GameBootstrapEnvelope env = null;
            yield return useCase.Run(e => env = e, _ => { });

            if (env != null && env.ok)
            {
                SyncSelectedChapterFromBootstrap();
                RefreshQuestSlots();
            }
        }

        private static void OnLeaveToChapterOverview()
        {
            GameFlowController.Instance?.LoadChapterOverview();
        }

        private void OnDestroy()
        {
            if (_doc != null)
                LearningToolkitNavigationFeedback.UnregisterPresentationDocument(_doc);
            _pauseChrome.Destroy();
            _unlockModal.Destroy();
            _loadingOverlay.Destroy();
            _loadErrorBanner.Destroy();

            if (_doc != null)
                Destroy(_doc.gameObject);
        }
    }
}
