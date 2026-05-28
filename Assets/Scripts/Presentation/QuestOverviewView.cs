using System;
using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    public sealed class QuestOverviewView : MonoBehaviour
    {
        private const int VisibleQuestSlots = 3;

        private UIDocument _doc;

        private Label _chapterTitleText;

        private readonly WalletHudBinder _walletHud = new();

        private readonly LearningToolkitPauseChromeBinder _pauseChrome = new();

        private readonly Button[] _questButtons = new Button[VisibleQuestSlots];

        private readonly Label[] _questTitles = new Label[VisibleQuestSlots];

        private readonly Label[] _questChips = new Label[VisibleQuestSlots];

        private GameProgressApiClient _gameApi;

        private readonly LearningToolkitLoadErrorBanner _loadErrorBanner = new LearningToolkitLoadErrorBanner();

        private readonly LearningToolkitLoadingOverlay _loadingOverlay = new LearningToolkitLoadingOverlay();

        private readonly LearningToolkitUnlockModal _unlockModal = new LearningToolkitUnlockModal();

        private bool _startingQuest;

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
            _chapterTitleText = root.Q<Label>("title-label");
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

            for (var idx = 0; idx < VisibleQuestSlots; idx++)
            {
                int slot = idx;
                _questButtons[idx] = root.Q<Button>($"quest-row-{idx}");
                _questTitles[idx] = root.Q<Label>($"quest-title-{idx}");
                _questChips[idx] = root.Q<Label>($"quest-chip-{idx}");
                _questButtons[idx]?.RegisterCallback<ClickEvent>(_ => OnQuestClicked(slot));
            }
        }

        private void Start()
        {
            GameFlowController flow = GameFlowController.Instance;
            if (flow != null)
                ChapterThemeRuntime.Apply(flow.SelectedChapterThemeJson);

            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            RefreshQuestSlots();
        }

        private void OnEnable()
        {
            _walletHud.Refresh();
        }

        private void RefreshQuestSlots()
        {
            GameFlowController flow = GameFlowController.Instance;
            if (flow == null)
            {
                DisableQuestSlots("—");

                _loadErrorBanner.Show(
                    "Navigation is unavailable. Go back one screen or Restart from Auth.",
                    RefreshQuestSlots);

                return;
            }

            _loadErrorBanner.Hide();

            if (_chapterTitleText != null)
            {
                _chapterTitleText.text = string.IsNullOrEmpty(flow.SelectedChapterDisplayName)
                    ? "Chapter quests"
                    : flow.SelectedChapterDisplayName;
            }

            _walletHud.Refresh();

            GameQuestBootstrapDto[] quests = flow.SelectedChapterQuests;
            for (var idx = 0; idx < VisibleQuestSlots; idx++)
                ApplyQuestSlot(idx, quests);
        }

        private void DisableQuestSlots(string placeholderTitle)
        {
            if (_chapterTitleText != null)
                _chapterTitleText.text = placeholderTitle ?? "Quests";

            for (var idx = 0; idx < VisibleQuestSlots; idx++)
            {
                if (_questButtons[idx] != null)
                    _questButtons[idx].SetEnabled(false);

                if (_questTitles[idx] != null)
                    _questTitles[idx].text = "—";

                ToggleChip(idx, DisplayStyle.None, string.Empty);
            }
        }

        private void ApplyQuestSlot(int idx, GameQuestBootstrapDto[] quests)
        {
            Button button = _questButtons[idx];
            if (button == null)
                return;

            if (quests == null || idx < 0 || idx >= quests.Length || quests[idx] == null)
            {
                button.SetEnabled(false);
                if (_questTitles[idx] != null)
                    _questTitles[idx].text = "—";

                ToggleChip(idx, DisplayStyle.None, string.Empty);
                return;
            }

            GameQuestBootstrapDto quest = quests[idx];
            var isCompleted = quest.hasCompletedAnyRun;
            var canStart = !_startingQuest && quest.isUnlocked && !isCompleted;
            button.SetEnabled(canStart);

            if (_questTitles[idx] != null)
                _questTitles[idx].text = quest.displayName ?? string.Empty;

            if (isCompleted)
            {
                ToggleChip(idx, DisplayStyle.Flex, "Fatto");
                return;
            }

            ToggleChip(idx, quest.isUnlocked ? DisplayStyle.None : DisplayStyle.Flex,
                quest.isUnlocked ? string.Empty : "Soon…");
        }

        private void ToggleChip(int idx, DisplayStyle visibility, string text)
        {
            Label chip = _questChips[idx];
            if (chip == null)
                return;

            chip.text = text;
            chip.style.display = visibility;
        }

        private void OnQuestClicked(int idx)
        {
            if (_startingQuest)
                return;

            GameFlowController flow = GameFlowController.Instance;
            if (flow == null)
            {
                RefreshQuestSlots();
                return;
            }

            GameQuestBootstrapDto[] quests = flow.SelectedChapterQuests;
            if (quests == null || idx < 0 || idx >= quests.Length)
                return;

            GameQuestBootstrapDto quest = quests[idx];
            if (quest == null)
                return;

            if (quest.hasCompletedAnyRun)
            {
                _unlockModal.Show("Quest already completed", "This quest can only be played once.");
                return;
            }

            if (!quest.isUnlocked)
            {
                string hint = string.IsNullOrEmpty(quest.unlockHint)
                    ? "Complete earlier quests before this unlocks!"
                    : quest.unlockHint;

                _unlockModal.Show("This quest is still locked", hint);
                return;
            }

            if (_gameApi == null)
                _gameApi = FindAnyObjectByType<GameProgressApiClient>();

            if (_gameApi == null)
            {
                Debug.LogError("[QuestOverviewView] Cannot start quest: GameProgressApiClient missing.");

                _loadErrorBanner.Show(
                    "GameProgressApiClient is missing — add it to GameFlow and Retry.",
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
            RefreshQuestSlots();

            _loadingOverlay.Show("Heading into your quest…");

            var useCase = new StartQuestRunUseCase(_gameApi);
            GameStartQuestEnvelope started = null;
            string err = string.Empty;
            yield return useCase.Run(quest.id, s => started = s, m => err = m);

            _loadingOverlay.Hide();

            if (started == null || !started.ok)
            {
                _startingQuest = false;
                RefreshQuestSlots();
                string message = string.IsNullOrEmpty(err)
                    ? "Could not start this quest."
                    : err;

                if (!string.IsNullOrEmpty(err) &&
                    err.IndexOf("quest_already_completed", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    _unlockModal.Show("Quest already completed", "This quest can only be played once.");
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
                RefreshQuestSlots();

                _loadErrorBanner.Show(
                    "Quest data arrived, but navigation is missing — return to chapters and Retry.",
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

            RefreshQuestSlots();
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
