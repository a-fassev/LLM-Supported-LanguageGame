using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class CityMapView : MonoBehaviour
    {
        private enum BootstrapLoadState
        {
            Idle,
            Loading,
            Ready,
            Error
        }

        private enum StartLevelState
        {
            Idle,
            Starting,
            Error
        }

        [SerializeField] private Button mainMenuButton;
        [SerializeField] private Button avatarShopButton;

        [Header("Map levels (slug must match server / Supabase seed)")]
        [SerializeField] private Button levelButtonA;
        [SerializeField] private string levelSlugA = "level-test-1";
        [SerializeField] private GameObject lockVisualA;
        [SerializeField] private Button levelButtonB;
        [SerializeField] private string levelSlugB = "level-test-2";
        [SerializeField] private GameObject lockVisualB;
        [SerializeField] private Button levelButtonC;
        [SerializeField] private string levelSlugC = "level-test-3";
        [SerializeField] private GameObject lockVisualC;

        [SerializeField] private Text pizzaSlicesText;

        private GameBootstrapEnvelope _bootstrap;
        private GameProgressApiClient _gameApi;

        private readonly LoadErrorBanner _loadErrorBanner = new LoadErrorBanner();
        private readonly LoadingOverlayPresenter _loadingOverlay = new LoadingOverlayPresenter();
        private GameLevelBootstrapDto _pendingStartLevelRetry;
        private bool _bootstrapReloadRequested;
        private BootstrapLoadState _bootstrapState = BootstrapLoadState.Idle;
        private StartLevelState _startLevelState = StartLevelState.Idle;

        private void Start()
        {
            mainMenuButton?.onClick.AddListener(OnMainMenuClicked);
            avatarShopButton?.onClick.AddListener(OnAvatarShopClicked);
            levelButtonA?.onClick.AddListener(() => OnLevelClicked(levelSlugA, levelButtonA));
            levelButtonB?.onClick.AddListener(() => OnLevelClicked(levelSlugB, levelButtonB));
            levelButtonC?.onClick.AddListener(() => OnLevelClicked(levelSlugC, levelButtonC));

            _gameApi = FindGameApiOrLog();
            if (GameSessionStateStore.TryGetLatestTotalSlices(out var cachedSlices))
                GameFlowController.Instance?.SetTotalPizzaSlices(cachedSlices);
            RefreshPizzaLabel();

            if (GameSessionStateStore.TryGetBootstrapSnapshot(out var cachedBootstrap))
            {
                _bootstrap = cachedBootstrap;
                _bootstrapState = BootstrapLoadState.Ready;
                _pendingStartLevelRetry = null;
                RefreshPizzaLabel();
                RefreshLevelButtons();
            }
            else
            {
                SetLevelSlotsDisabledVisual();
            }

            if (_gameApi == null)
                return;

            if (_bootstrap == null || !GameSessionStateStore.IsBootstrapFresh(GameSessionStateStore.DefaultBootstrapFreshSeconds))
                StartCoroutine(LoadBootstrapRoutine(_gameApi, showBlockingOverlay: _bootstrap == null));
        }

        private GameProgressApiClient FindGameApiOrLog()
        {
            var api = FindAnyObjectByType<GameProgressApiClient>();
            if (api == null)
                Debug.LogError("[CityMapView] GameProgressApiClient not found (expected on GameFlow).");
            return api;
        }

        private void EnsureMapErrorBanner()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
            {
                Debug.LogError("[CityMapView] No Canvas in parent hierarchy; load error banner cannot be created.");
                return;
            }

            UiThemeProvider.TryGet(out var tokens);
            _loadErrorBanner.Ensure(canvas, tokens);
        }

        private bool EnsureLoadingOverlay()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
            {
                Debug.LogError("[CityMapView] No Canvas in parent hierarchy; loading overlay cannot be created.");
                return false;
            }

            UiThemeProvider.TryGet(out var tokens);
            return _loadingOverlay.Ensure(canvas, tokens);
        }

        private IEnumerator LoadBootstrapRoutine(GameProgressApiClient api, bool showBlockingOverlay)
        {
            if (_bootstrapState == BootstrapLoadState.Loading)
            {
                _bootstrapReloadRequested = true;
                yield break;
            }

            _bootstrapState = BootstrapLoadState.Loading;
            _bootstrapReloadRequested = false;
            EnsureMapErrorBanner();
            var overlayReady = EnsureLoadingOverlay();
            _loadErrorBanner.SetRetryInteractable(false);
            if (showBlockingOverlay && !_loadingOverlay.Show("Loading map...") && !overlayReady)
                Debug.LogWarning("[CityMapView] Blocking loading overlay unavailable; using inline loading state.");
            try
            {
                _loadErrorBanner.Hide();
                var useCase = new LoadGameBootstrapUseCase(api);
                GameBootstrapEnvelope env = null;
                var err = string.Empty;
                yield return useCase.Run(e => env = e, m => err = m);

                if (env == null || !env.ok)
                {
                    _bootstrapState = BootstrapLoadState.Error;
                    Debug.LogWarning($"[CityMapView] Bootstrap failed: {err}");
                    _pendingStartLevelRetry = null;
                    _loadErrorBanner.Show(
                        string.IsNullOrEmpty(err)
                            ? "Could not load game data. Is the web API running?"
                            : err,
                        () =>
                        {
                            if (_gameApi == null)
                                _gameApi = FindGameApiOrLog();
                            if (_gameApi != null)
                                StartCoroutine(LoadBootstrapRoutine(_gameApi, showBlockingOverlay: _bootstrap == null));
                        });
                    if (_bootstrap == null)
                        SetLevelSlotsDisabledVisual();
                    yield break;
                }

                _bootstrapState = BootstrapLoadState.Ready;
                _loadErrorBanner.Hide();
                _bootstrap = env;
                _pendingStartLevelRetry = null;
                GameFlowController.Instance?.SetTotalPizzaSlices(env.totalSlices);
                RefreshPizzaLabel();
                RefreshLevelButtons();
            }
            finally
            {
                _loadingOverlay.Hide();
                _loadErrorBanner.SetRetryInteractable(true);
                if (_bootstrapReloadRequested && _gameApi != null)
                    StartCoroutine(LoadBootstrapRoutine(_gameApi, showBlockingOverlay: false));
            }
        }

        private void SetLevelSlotsDisabledVisual()
        {
            ApplySlot(levelButtonA, lockVisualA, levelSlugA, forceLocked: true);
            ApplySlot(levelButtonB, lockVisualB, levelSlugB, forceLocked: true);
            ApplySlot(levelButtonC, lockVisualC, levelSlugC, forceLocked: true);
        }

        private void RefreshPizzaLabel()
        {
            var slices = GameFlowController.Instance != null ? GameFlowController.Instance.TotalPizzaSlices : 0;
            var line = $"Pizza slices: {slices}";
            if (pizzaSlicesText != null)
                pizzaSlicesText.text = line;
        }

        private void RefreshLevelButtons()
        {
            if (_bootstrap?.levels == null)
            {
                SetLevelSlotsDisabledVisual();
                return;
            }

            ApplySlot(levelButtonA, lockVisualA, levelSlugA);
            ApplySlot(levelButtonB, lockVisualB, levelSlugB);
            ApplySlot(levelButtonC, lockVisualC, levelSlugC);
        }

        private void ApplySlot(Button button, GameObject lockVisual, string slug, bool forceLocked = false)
        {
            if (button == null || string.IsNullOrEmpty(slug))
                return;

            var level = FindLevel(slug);
            var unlocked = !forceLocked && level != null && level.isUnlocked;
            button.interactable = unlocked && _startLevelState != StartLevelState.Starting;
            var g = button.targetGraphic as Graphic;
            if (g != null)
            {
                UiThemeProvider.TryGet(out var t);
                g.color = unlocked ? Color.white : (t?.palette.disabled ?? new Color(0.55f, 0.55f, 0.55f, 0.95f));
            }

            if (lockVisual != null)
                lockVisual.SetActive(!unlocked);
        }

        private GameLevelBootstrapDto FindLevel(string slug)
        {
            if (_bootstrap?.levels == null)
                return null;
            foreach (var l in _bootstrap.levels)
            {
                if (l != null && string.Equals(l.slug, slug, StringComparison.Ordinal))
                    return l;
            }
            return null;
        }

        private void OnMainMenuClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[CityMapView] GameFlowController not found.");
                return;
            }
            GameFlowController.Instance.LoadMainMenu();
        }

        private void OnAvatarShopClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[CityMapView] GameFlowController not found.");
                return;
            }
            GameFlowController.Instance.LoadAvatarShopFromCityMap();
        }

        private void OnLevelClicked(string slug, Button button)
        {
            if (GameFlowController.Instance == null || button == null || _startLevelState == StartLevelState.Starting)
                return;

            var level = FindLevel(slug);
            if (level == null)
            {
                Debug.LogWarning($"[CityMapView] Unknown level slug: {slug}");
                return;
            }

            if (!level.isUnlocked)
            {
                Debug.Log("[CityMapView] Level is locked.");
                return;
            }

            var api = FindGameApiOrLog();
            if (api == null)
                return;

            StartCoroutine(StartLevelRoutine(api, level));
        }

        private void OnRetryStartLevelClicked()
        {
            if (_gameApi == null)
                _gameApi = FindGameApiOrLog();
            if (_gameApi == null || _pendingStartLevelRetry == null)
                return;
            StartCoroutine(StartLevelRoutine(_gameApi, _pendingStartLevelRetry));
        }

        private IEnumerator StartLevelRoutine(GameProgressApiClient api, GameLevelBootstrapDto level)
        {
            if (_startLevelState == StartLevelState.Starting)
                yield break;

            _startLevelState = StartLevelState.Starting;
            _pendingStartLevelRetry = level;
            EnsureMapErrorBanner();
            var overlayReady = EnsureLoadingOverlay();
            _loadErrorBanner.SetRetryInteractable(false);
            if (!_loadingOverlay.Show("Entering level...") && !overlayReady)
                Debug.LogWarning("[CityMapView] Level-entry overlay unavailable; level buttons remain disabled while loading.");
            RefreshLevelButtons();

            try
            {
                var useCase = new StartLevelRunUseCase(api);
                GameStartLevelEnvelope started = null;
                var err = string.Empty;
                yield return useCase.Run(level.id, s => started = s, m => err = m);

                if (started == null || !started.ok)
                {
                    _startLevelState = StartLevelState.Error;
                    Debug.LogWarning($"[CityMapView] Start level failed: {err}");
                    _loadErrorBanner.Show(
                        string.IsNullOrEmpty(err)
                            ? "Could not start this level. Is the web API running?"
                            : err,
                        OnRetryStartLevelClicked);
                    yield break;
                }

                _loadErrorBanner.Hide();
                _pendingStartLevelRetry = null;
                _startLevelState = StartLevelState.Idle;

                GameFlowController.Instance.SetTotalPizzaSlices(started.totalSlices);
                GameFlowController.Instance.BeginServerLevel(
                    started.runId,
                    started.levelId,
                    started.displayName,
                    started.tasks,
                    started.currentTaskOrderIndex,
                    started.totalSlices);
            }
            finally
            {
                _loadingOverlay.Hide();
                if (_startLevelState == StartLevelState.Starting)
                    _startLevelState = StartLevelState.Idle;
                _loadErrorBanner.SetRetryInteractable(true);
                RefreshLevelButtons();
            }
        }

        private void OnDestroy()
        {
            mainMenuButton?.onClick.RemoveAllListeners();
            avatarShopButton?.onClick.RemoveAllListeners();
            levelButtonA?.onClick.RemoveAllListeners();
            levelButtonB?.onClick.RemoveAllListeners();
            levelButtonC?.onClick.RemoveAllListeners();
            _loadErrorBanner.Destroy();
            _loadingOverlay.Destroy();
        }
    }
}
