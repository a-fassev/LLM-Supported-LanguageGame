using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    public sealed class ChapterOverviewView : MonoBehaviour
    {
        private const int VisibleChapterSlots = 3;

        private UIDocument _doc;

        private readonly WalletHudBinder _walletHud = new();

        private readonly LearningToolkitPauseChromeBinder _pauseChrome = new();

        private readonly Button[] _chapterButtons = new Button[VisibleChapterSlots];

        private readonly Label[] _chapterTitles = new Label[VisibleChapterSlots];

        private readonly Label[] _chapterChips = new Label[VisibleChapterSlots];

        private GameProgressApiClient _gameApi;

        private readonly LearningToolkitLoadErrorBanner _loadErrorBanner = new LearningToolkitLoadErrorBanner();

        private readonly LearningToolkitLoadingOverlay _loadingOverlay = new LearningToolkitLoadingOverlay();

        private readonly LearningToolkitUnlockModal _unlockModal = new LearningToolkitUnlockModal();

        private void Awake()
        {
            _doc = LearningToolkitBootstrap.SpawnUiDocument(this, "Screens/ChapterOverviewScreen");
            if (_doc == null)
            {
                Debug.LogError("[ChapterOverviewView] UI Toolkit bootstrap failed — check Resources paths and PanelSettings.");
                enabled = false;
                return;
            }

            AttachOverlays();

            LearningToolkitNavigationFeedback.RegisterPresentationDocument(_doc);

            VisualElement root = _doc.rootVisualElement;
            ToolkitNavigationScreenBinder.ApplyChapterOverviewScreen(root);

            if (!_walletHud.Bind(_doc))
            {
                Debug.LogError("[ChapterOverviewView] Wallet HUD bind failed.");
                enabled = false;
                return;
            }

            if (!_pauseChrome.Bind(_doc, LearningToolkitChromeUx.LeaveToMainMenuLabel, OnLeaveToMainMenu))
            {
                Debug.LogError("[ChapterOverviewView] Pause chrome bind failed.");
                enabled = false;
                return;
            }

            for (var idx = 0; idx < VisibleChapterSlots; idx++)
            {
                int slot = idx;
                _chapterButtons[idx] = root.Q<Button>($"chapter-row-{idx}");
                _chapterTitles[idx] = root.Q<Label>($"chapter-title-{idx}");
                _chapterChips[idx] = root.Q<Label>($"chapter-chip-{idx}");
                _chapterButtons[idx]?.RegisterCallback<ClickEvent>(_ => OnChapterClicked(slot));
            }
        }

        private void AttachOverlays()
        {
            VisualElement overlay = LearningToolkitBootstrap.ResolveOverlayPlane(_doc);
            if (overlay == null)
            {
                Debug.LogError("[ChapterOverviewView] overlay-plane missing.");
                return;
            }

            _loadingOverlay.Attach(overlay);
            _loadErrorBanner.Attach(overlay);
            _unlockModal.Attach(overlay);
        }

        private void Start()
        {
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            StartCoroutine(EnsureBootstrapThenRefresh());
        }

        private IEnumerator EnsureBootstrapThenRefresh()
        {
            if (_gameApi == null)
            {
                Debug.LogWarning("[ChapterOverviewView] GameProgressApiClient not found.");

                _loadErrorBanner.Show(
                    "GameProgressApiClient non trovato nella scena — aggiungilo a GameFlow o riprova.",
                    RestartBootstrapRoutine);
                yield break;
            }

            // Reload bootstrap when missing, stale, or invalidated (e.g. after task completion).
            // Otherwise wallet labels show fresh totals from the API while chapter/quest isUnlocked stays stale.
            bool hasSnapshot = GameSessionStateStore.TryGetBootstrapSnapshot(out _);
            bool needBootstrap =
                !hasSnapshot || !GameSessionStateStore.IsBootstrapFresh(GameSessionStateStore.DefaultBootstrapFreshSeconds);

            if (needBootstrap)
            {
                var useCase = new LoadGameBootstrapUseCase(_gameApi);
                GameBootstrapEnvelope env = null;
                string err = string.Empty;

                _loadingOverlay.Show("Caricamento capitoli…");
                yield return useCase.Run(e => env = e, m => err = m);
                _loadingOverlay.Hide();

                if (env == null || !env.ok)
                {
                    if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                    {
                        GameFlowController.Instance?.LoadAuth();
                        yield break;
                    }

                    _loadErrorBanner.Show(
                        string.IsNullOrEmpty(err) ? "Impossibile caricare i capitoli." : err,
                        RestartBootstrapRoutine);
                    yield break;
                }

                _loadErrorBanner.Hide();
            }

            RefreshUi();
        }

        private void RestartBootstrapRoutine()
        {
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            StartCoroutine(EnsureBootstrapThenRefresh());
        }

        private void RefreshUi()
        {
            _walletHud.Refresh();

            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[ChapterOverviewView] GameFlowController.Instance is null.");

                _loadErrorBanner.Show(
                    "Navigazione non disponibile. Riavvia da Accesso o riprova.",
                    RestartBootstrapRoutine);

                DisableChapterRowsInteractive();
                return;
            }

            if (!GameSessionStateStore.TryGetBootstrapSnapshot(out var bootstrap) ||
                bootstrap?.chapters == null)
            {
                _loadErrorBanner.Show(
                    "Nessun dato capitoli disponibile. Controlla la rete o riprova.",
                    RestartBootstrapRoutine);

                DisableChapterRowsInteractive();
                return;
            }

            for (var idx = 0; idx < VisibleChapterSlots; idx++)
                ApplyChapterSlot(idx, bootstrap.chapters);
        }

        private void DisableChapterRowsInteractive()
        {
            for (var idx = 0; idx < VisibleChapterSlots; idx++)
            {
                Button button = _chapterButtons[idx];
                if (button != null)
                    button.SetEnabled(false);

                if (_chapterTitles[idx] != null)
                    _chapterTitles[idx].text = "—";

                ToggleChip(idx, DisplayStyle.None, string.Empty);
            }
        }

        private void ApplyChapterSlot(int idx, GameChapterBootstrapDto[] chapters)
        {
            Button button = _chapterButtons[idx];
            if (button == null)
                return;

            if (chapters == null || idx < 0 || idx >= chapters.Length || chapters[idx] == null)
            {
                button.SetEnabled(false);
                if (_chapterTitles[idx] != null)
                    _chapterTitles[idx].text = "—";

                ToggleChip(idx, DisplayStyle.None, string.Empty);
                return;
            }

            GameChapterBootstrapDto chapter = chapters[idx];

            button.SetEnabled(true);

            if (_chapterTitles[idx] != null)
                _chapterTitles[idx].text = chapter.displayName ?? string.Empty;

            if (!chapter.isUnlocked)
                ToggleChip(idx, DisplayStyle.Flex, "Prossimo");
            else
                ToggleChip(idx, DisplayStyle.None, string.Empty);
        }

        private void ToggleChip(int idx, DisplayStyle visibility, string text)
        {
            Label chip = _chapterChips[idx];
            if (chip == null)
                return;

            chip.text = text;
            chip.style.display = visibility;
        }

        private void OnChapterClicked(int idx)
        {
            GameFlowController flow = GameFlowController.Instance;
            if (flow == null)
                return;

            if (!GameSessionStateStore.TryGetBootstrapSnapshot(out var bootstrap) || bootstrap?.chapters == null)
                return;

            if (idx < 0 || idx >= bootstrap.chapters.Length)
                return;

            GameChapterBootstrapDto chapter = bootstrap.chapters[idx];
            if (chapter == null)
                return;

            if (!chapter.isUnlocked)
            {
                string hint = string.IsNullOrEmpty(chapter.unlockHint)
                    ? "Completa i capitoli precedenti per sbloccare questo!"
                    : chapter.unlockHint;

                _unlockModal.Show("Capitolo ancora bloccato", hint);
                return;
            }

            flow.SetSelectedChapter(chapter);
            ChapterThemeRuntime.Apply(chapter.themeJson);
            flow.LoadQuestOverview();
        }

        private static void OnLeaveToMainMenu()
        {
            GameFlowController.Instance?.LoadMainMenu();
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
