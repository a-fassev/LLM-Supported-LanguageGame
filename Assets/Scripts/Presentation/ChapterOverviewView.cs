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

        private Label _titleText;

        private Label _walletPizza;

        private Label _walletBackpack;

        private Button _backButton;

        private Button _avatarShopButton;

        private readonly Button[] _chapterButtons = new Button[VisibleChapterSlots];

        private readonly Label[] _chapterTitles = new Label[VisibleChapterSlots];

        private readonly Label[] _chapterChips = new Label[VisibleChapterSlots];

        private GameProgressApiClient _gameApi;

        private readonly LearningToolkitLoadErrorBanner _loadErrorBanner = new LearningToolkitLoadErrorBanner();

        private readonly LearningToolkitLoadingOverlay _loadingOverlay = new LearningToolkitLoadingOverlay();

        private readonly LearningToolkitUnlockModal _unlockModal = new LearningToolkitUnlockModal();

        private void Awake()
        {
            _doc = LearningToolkitBootstrap.SpawnUiDocument(this, "ChapterOverviewScreen");
            if (_doc == null)
            {
                Debug.LogError("[ChapterOverviewView] UI Toolkit bootstrap failed — check Resources paths and PanelSettings.");
                enabled = false;
                return;
            }

            AttachOverlays();

            LearningToolkitNavigationFeedback.RegisterPresentationDocument(_doc);

            VisualElement root = _doc.rootVisualElement;
            _titleText = root.Q<Label>("title-label");
            _walletPizza = root.Q<Label>("wallet-pizza");
            _walletBackpack = root.Q<Label>("wallet-backpack");
            _backButton = root.Q<Button>("back-button");
            _avatarShopButton = root.Q<Button>("avatar-shop-button");

            _backButton?.RegisterCallback<ClickEvent>(_ => OnBackToMenuClicked());
            _avatarShopButton?.RegisterCallback<ClickEvent>(_ => OnAvatarShopClicked());

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
                    "GameProgressApiClient was not found in the scene — add it to GameFlow or Retry.",
                    RestartBootstrapRoutine);
                yield break;
            }

            if (!GameSessionStateStore.TryGetBootstrapSnapshot(out _))
            {
                var useCase = new LoadGameBootstrapUseCase(_gameApi);
                GameBootstrapEnvelope env = null;
                string err = string.Empty;

                _loadingOverlay.Show("Loading chapters…");
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
                        string.IsNullOrEmpty(err) ? "Could not load chapters." : err,
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
            if (_titleText != null)
                _titleText.text = "Choose a chapter";

            RefreshWallet();

            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[ChapterOverviewView] GameFlowController.Instance is null.");

                _loadErrorBanner.Show(
                    "Navigation is unavailable. Restart from Auth or Retry.",
                    RestartBootstrapRoutine);

                DisableChapterRowsInteractive();
                return;
            }

            if (!GameSessionStateStore.TryGetBootstrapSnapshot(out var bootstrap) ||
                bootstrap?.chapters == null)
            {
                _loadErrorBanner.Show(
                    "No chapter bootstrap data yet. Check the network or Retry.",
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

        private void RefreshWallet()
        {
            int pizzaTotal = ExtractTotalSlices();
            int backpackTotal = ExtractBackpackPieces();

            if (_walletPizza != null)
                _walletPizza.text = pizzaTotal.ToString();

            if (_walletBackpack != null)
                _walletBackpack.text = backpackTotal.ToString();
        }

        private static int ExtractTotalSlices()
        {
            if (GameSessionStateStore.TryGetLatestTotalSlices(out var slicesFromStore))
                return slicesFromStore;

            return GameFlowController.Instance != null ? GameFlowController.Instance.TotalPizzaSlices : 0;
        }

        private static int ExtractBackpackPieces()
        {
            if (GameSessionStateStore.TryGetLatestTotalBackpackPieces(out var pieces))
                return pieces;

            return GameFlowController.Instance != null ? GameFlowController.Instance.TotalBackpackPieces : 0;
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
                ToggleChip(idx, DisplayStyle.Flex, "Next");
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
                    ? "Finish earlier chapters before this unlocks!"
                    : chapter.unlockHint;

                _unlockModal.Show("This chapter stays locked", hint);
                return;
            }

            flow.SetSelectedChapter(chapter);
            ChapterThemeRuntime.Apply(chapter.themeJson);
            flow.LoadQuestOverview();
        }

        private static void OnBackToMenuClicked()
        {
            GameFlowController.Instance?.LoadMainMenu();
        }

        private void OnAvatarShopClicked()
        {
            GameFlowController flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[ChapterOverviewView] GameFlowController missing.");
                return;
            }

            flow.LoadAvatarShopFromChapterOverview();
        }

        private void OnDestroy()
        {
            if (_doc != null)
                LearningToolkitNavigationFeedback.UnregisterPresentationDocument(_doc);
            _unlockModal.Destroy();
            _loadingOverlay.Destroy();
            _loadErrorBanner.Destroy();

            if (_doc != null)
                Destroy(_doc.gameObject);
        }
    }
}
