using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;

namespace LanguageGame.Presentation
{
    public sealed class QuestOverviewView : MonoBehaviour
    {
        [SerializeField] private Button backToChapterButton;
        [SerializeField] private Button questButtonA;
        [SerializeField] private Text questLabelA;
        [SerializeField] private Button questButtonB;
        [SerializeField] private Text questLabelB;
        [SerializeField] private Button questButtonC;
        [SerializeField] private Text questLabelC;
        [SerializeField] private Text chapterTitleText;

        private GameProgressApiClient _gameApi;
        private readonly LoadErrorBanner _loadErrorBanner = new LoadErrorBanner();
        private readonly LoadingOverlayPresenter _loadingOverlay = new LoadingOverlayPresenter();
        private readonly UnlockHintModalPresenter _unlockModal = new UnlockHintModalPresenter();
        private bool _startingQuest;

        private void Awake()
        {
            EnsureRuntimeFallback();
        }

        private void Start()
        {
            var flow = GameFlowController.Instance;
            if (flow != null)
                ChapterThemeRuntime.Apply(flow.SelectedChapterThemeJson);

            backToChapterButton?.onClick.AddListener(OnBackToChapterClicked);
            questButtonA?.onClick.AddListener(() => OnQuestClicked(0));
            questButtonB?.onClick.AddListener(() => OnQuestClicked(1));
            questButtonC?.onClick.AddListener(() => OnQuestClicked(2));
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            RefreshQuestSlots();
            EnsureUnlockModal();
        }

        private void RefreshQuestSlots()
        {
            var flow = GameFlowController.Instance;
            if (flow == null)
                return;

            if (chapterTitleText != null)
                chapterTitleText.text = string.IsNullOrEmpty(flow.SelectedChapterDisplayName) ? "Quests" : flow.SelectedChapterDisplayName;

            var quests = flow.SelectedChapterQuests;
            ApplyQuestSlot(questButtonA, questLabelA, quests, 0);
            ApplyQuestSlot(questButtonB, questLabelB, quests, 1);
            ApplyQuestSlot(questButtonC, questLabelC, quests, 2);
        }

        private void ApplyQuestSlot(Button button, Text label, GameQuestBootstrapDto[] quests, int idx)
        {
            if (button == null)
                return;

            if (quests == null || idx < 0 || idx >= quests.Length || quests[idx] == null)
            {
                button.interactable = false;
                if (label != null)
                    label.text = "N/A";
                return;
            }

            var quest = quests[idx];
            button.interactable = quest != null && !_startingQuest;
            if (label != null)
            {
                var suffix = quest.isUnlocked ? string.Empty : " (Locked)";
                label.text = quest.displayName + suffix;
            }
        }

        private void OnQuestClicked(int idx)
        {
            if (_startingQuest)
                return;

            var flow = GameFlowController.Instance;
            if (flow == null)
                return;
            var quests = flow.SelectedChapterQuests;
            if (quests == null || idx < 0 || idx >= quests.Length)
                return;
            var quest = quests[idx];
            if (quest == null)
                return;

            EnsureUnlockModal();
            if (!quest.isUnlocked)
            {
                var hint = string.IsNullOrEmpty(quest.unlockHint) ? "This quest is locked." : quest.unlockHint;
                _unlockModal.Show("Quest locked", hint);
                return;
            }

            if (_gameApi == null)
                _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            if (_gameApi == null)
                return;

            StartCoroutine(StartQuestRoutine(quest));
        }

        private IEnumerator StartQuestRoutine(GameQuestBootstrapDto quest)
        {
            _startingQuest = true;
            RefreshQuestSlots();
            EnsureErrorBanner();
            var overlayReady = EnsureLoadingOverlay();
            if (overlayReady)
                _loadingOverlay.Show("Entering quest...");
            else
                Debug.LogWarning("[QuestOverviewView] Loading overlay unavailable while starting quest.");

            var useCase = new StartQuestRunUseCase(_gameApi);
            GameStartQuestEnvelope started = null;
            var err = string.Empty;
            yield return useCase.Run(quest.id, s => started = s, m => err = m);

            _loadingOverlay.Hide();

            if (started == null || !started.ok)
            {
                _startingQuest = false;
                _loadErrorBanner.Show(string.IsNullOrEmpty(err) ? "Could not start quest." : err, RefreshQuestSlots);
                RefreshQuestSlots();
                yield break;
            }

            _loadErrorBanner.Hide();
            _startingQuest = false;
            GameFlowController.Instance?.SetTotalPizzaSlices(started.totalSlices);
            GameFlowController.Instance?.SetTotalBackpackPieces(started.totalBackpackPieces);
            GameFlowController.Instance?.BeginServerQuest(
                started.runId,
                started.questId,
                started.displayName,
                started.steps,
                started.currentStepOrderIndex,
                started.currentTaskOrderIndex,
                started.totalSlices,
                started.totalBackpackPieces);
        }

        private bool EnsureLoadingOverlay()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
                canvas = FindAnyObjectByType<Canvas>();
            if (canvas == null)
                return false;
            UiThemeProvider.TryGet(out var tokens);
            return _loadingOverlay.Ensure(canvas, tokens);
        }

        private void EnsureErrorBanner()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
                canvas = FindAnyObjectByType<Canvas>();
            if (canvas == null)
                return;
            UiThemeProvider.TryGet(out var tokens);
            _loadErrorBanner.Ensure(canvas, tokens);
        }

        private void EnsureUnlockModal()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
                canvas = FindAnyObjectByType<Canvas>();
            if (canvas == null)
                return;
            UiThemeProvider.TryGet(out var tokens);
            var font = chapterTitleText != null ? chapterTitleText.font : null;
            _unlockModal.Ensure(canvas, tokens, font);
        }

        private void OnBackToChapterClicked()
        {
            GameFlowController.Instance?.LoadChapterOverview();
        }

        private void OnDestroy()
        {
            backToChapterButton?.onClick.RemoveListener(OnBackToChapterClicked);
            questButtonA?.onClick.RemoveAllListeners();
            questButtonB?.onClick.RemoveAllListeners();
            questButtonC?.onClick.RemoveAllListeners();
            _loadErrorBanner.Destroy();
            _loadingOverlay.Destroy();
            _unlockModal.Destroy();
        }

        private void EnsureRuntimeFallback()
        {
            EnsureEventSystem();
            var canvas = FindAnyObjectByType<Canvas>();
            if (canvas == null)
            {
                var cgo = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
                canvas = cgo.GetComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                var scaler = cgo.GetComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920f, 1080f);
            }

            if (chapterTitleText == null)
                chapterTitleText = CreateText("Title", canvas.transform, "Quests", new Vector2(0.3f, 0.82f), new Vector2(0.7f, 0.92f), 44, FontStyle.Bold);

            if (backToChapterButton == null)
                backToChapterButton = CreateButton("BackToChapterButton", canvas.transform, "Back", new Vector2(0.04f, 0.04f), new Vector2(0.22f, 0.11f));

            if (questButtonA == null || questLabelA == null)
                questButtonA = CreateButtonWithLabel("QuestButtonA", canvas.transform, out questLabelA, new Vector2(0.2f, 0.56f), new Vector2(0.8f, 0.68f));
            if (questButtonB == null || questLabelB == null)
                questButtonB = CreateButtonWithLabel("QuestButtonB", canvas.transform, out questLabelB, new Vector2(0.2f, 0.4f), new Vector2(0.8f, 0.52f));
            if (questButtonC == null || questLabelC == null)
                questButtonC = CreateButtonWithLabel("QuestButtonC", canvas.transform, out questLabelC, new Vector2(0.2f, 0.24f), new Vector2(0.8f, 0.36f));
        }

        private static void EnsureEventSystem()
        {
            if (FindAnyObjectByType<EventSystem>() != null)
                return;
            new GameObject("EventSystem", typeof(EventSystem), typeof(InputSystemUIInputModule));
        }

        private static Text CreateText(string name, Transform parent, string value, Vector2 min, Vector2 max, int size, FontStyle style)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = min;
            rt.anchorMax = max;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var t = go.GetComponent<Text>();
            t.font = UiTokenApplier.ResolveFallbackFont();
            t.fontSize = size;
            t.fontStyle = style;
            t.alignment = TextAnchor.MiddleCenter;
            t.color = Color.white;
            t.text = value;
            return t;
        }

        private static Button CreateButton(string name, Transform parent, string label, Vector2 min, Vector2 max)
        {
            var btn = CreateButtonWithLabel(name, parent, out var txt, min, max);
            if (txt != null)
                txt.text = label;
            return btn;
        }

        private static Button CreateButtonWithLabel(string name, Transform parent, out Text label, Vector2 min, Vector2 max)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = min;
            rt.anchorMax = max;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            var img = go.GetComponent<Image>();
            img.color = new Color(0.2f, 0.55f, 0.85f, 1f);
            var button = go.GetComponent<Button>();
            label = CreateText("Label", go.transform, name, Vector2.zero, Vector2.one, 30, FontStyle.Bold);
            return button;
        }
    }
}
