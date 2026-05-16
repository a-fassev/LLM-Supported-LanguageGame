using System;
using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;

namespace LanguageGame.Presentation
{
    public sealed class ChapterOverviewView : MonoBehaviour
    {
        [SerializeField] private Button backToMenuButton;
        [SerializeField] private Button chapterButtonA;
        [SerializeField] private Text chapterLabelA;
        [SerializeField] private Button chapterButtonB;
        [SerializeField] private Text chapterLabelB;
        [SerializeField] private Button chapterButtonC;
        [SerializeField] private Text chapterLabelC;
        [SerializeField] private Text titleText;

        private GameProgressApiClient _gameApi;
        private readonly LoadErrorBanner _loadErrorBanner = new LoadErrorBanner();
        private readonly LoadingOverlayPresenter _loadingOverlay = new LoadingOverlayPresenter();
        private readonly UnlockHintModalPresenter _unlockModal = new UnlockHintModalPresenter();

        private void Awake()
        {
            EnsureRuntimeFallback();
        }

        private void Start()
        {
            backToMenuButton?.onClick.AddListener(OnBackToMenuClicked);
            chapterButtonA?.onClick.AddListener(() => OnChapterClicked(0));
            chapterButtonB?.onClick.AddListener(() => OnChapterClicked(1));
            chapterButtonC?.onClick.AddListener(() => OnChapterClicked(2));
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            StartCoroutine(EnsureBootstrapThenRefresh());
        }

        private IEnumerator EnsureBootstrapThenRefresh()
        {
            if (!GameSessionStateStore.TryGetBootstrapSnapshot(out _) && _gameApi != null)
            {
                var useCase = new LoadGameBootstrapUseCase(_gameApi);
                GameBootstrapEnvelope env = null;
                var err = string.Empty;
                EnsureErrorBanner();
                var overlayReady = EnsureLoadingOverlay();
                if (overlayReady)
                    _loadingOverlay.Show("Loading chapters...");
                else
                    Debug.LogWarning("[ChapterOverviewView] Loading overlay unavailable while loading chapters.");
                yield return useCase.Run(e => env = e, m => err = m);
                _loadingOverlay.Hide();
                if (env == null || !env.ok)
                    _loadErrorBanner.Show(string.IsNullOrEmpty(err) ? "Could not load chapters." : err, RefreshUi);
                else
                    _loadErrorBanner.Hide();
            }

            RefreshUi();
            EnsureUnlockModal();
        }
        {
            if (titleText != null)
                titleText.text = "Choose chapter";

            var flow = GameFlowController.Instance;
            if (flow == null)
                return;
            if (!GameSessionStateStore.TryGetBootstrapSnapshot(out var bootstrap) || bootstrap == null || bootstrap.chapters == null)
                return;

            ApplyChapterSlot(chapterButtonA, chapterLabelA, bootstrap.chapters, 0);
            ApplyChapterSlot(chapterButtonB, chapterLabelB, bootstrap.chapters, 1);
            ApplyChapterSlot(chapterButtonC, chapterLabelC, bootstrap.chapters, 2);
        }

        private void ApplyChapterSlot(Button button, Text label, GameChapterBootstrapDto[] chapters, int idx)
        {
            if (button == null)
                return;

            if (chapters == null || idx < 0 || idx >= chapters.Length || chapters[idx] == null)
            {
                button.interactable = false;
                if (label != null)
                    label.text = "N/A";
                return;
            }

            var chapter = chapters[idx];
            button.interactable = true;
            if (label != null)
            {
                var suffix = chapter.isUnlocked ? string.Empty : " (Locked)";
                label.text = chapter.displayName + suffix;
            }
        }

        private void OnChapterClicked(int idx)
        {
            var flow = GameFlowController.Instance;
            if (flow == null)
                return;
            if (!GameSessionStateStore.TryGetBootstrapSnapshot(out var bootstrap) || bootstrap?.chapters == null)
                return;
            if (idx < 0 || idx >= bootstrap.chapters.Length)
                return;
            var chapter = bootstrap.chapters[idx];
            if (chapter == null)
                return;

            EnsureUnlockModal();
            if (!chapter.isUnlocked)
            {
                var hint = string.IsNullOrEmpty(chapter.unlockHint)
                    ? "Complete the previous chapter to unlock this chapter."
                    : chapter.unlockHint;
                _unlockModal.Show("Chapter locked", hint);
                return;
            }

            flow.SetSelectedChapter(chapter);
            ChapterThemeRuntime.Apply(chapter.themeJson);
            flow.LoadQuestOverview();
        }

        private void OnBackToMenuClicked()
        {
            GameFlowController.Instance?.LoadMainMenu();
        }

        private void OnDestroy()
        {
            backToMenuButton?.onClick.RemoveListener(OnBackToMenuClicked);
            chapterButtonA?.onClick.RemoveAllListeners();
            chapterButtonB?.onClick.RemoveAllListeners();
            chapterButtonC?.onClick.RemoveAllListeners();
            _loadErrorBanner.Destroy();
            _loadingOverlay.Destroy();
            _unlockModal.Destroy();
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
            var font = titleText != null ? titleText.font : null;
            _unlockModal.Ensure(canvas, tokens, font);
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

            if (titleText == null)
                titleText = CreateText("Title", canvas.transform, "Choose chapter", new Vector2(0.3f, 0.82f), new Vector2(0.7f, 0.92f), 44, FontStyle.Bold);

            if (backToMenuButton == null)
                backToMenuButton = CreateButton("BackToMenuButton", canvas.transform, "Back to menu", new Vector2(0.04f, 0.04f), new Vector2(0.22f, 0.11f));

            if (chapterButtonA == null || chapterLabelA == null)
                chapterButtonA = CreateButtonWithLabel("ChapterButtonA", canvas.transform, out chapterLabelA, new Vector2(0.2f, 0.56f), new Vector2(0.8f, 0.68f));
            if (chapterButtonB == null || chapterLabelB == null)
                chapterButtonB = CreateButtonWithLabel("ChapterButtonB", canvas.transform, out chapterLabelB, new Vector2(0.2f, 0.4f), new Vector2(0.8f, 0.52f));
            if (chapterButtonC == null || chapterLabelC == null)
                chapterButtonC = CreateButtonWithLabel("ChapterButtonC", canvas.transform, out chapterLabelC, new Vector2(0.2f, 0.24f), new Vector2(0.8f, 0.36f));
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
