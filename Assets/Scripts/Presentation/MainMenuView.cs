using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class MainMenuView : MonoBehaviour
    {
        private enum BootstrapLoadState
        {
            Idle,
            Loading,
            Ready,
            Error
        }

        [SerializeField] private Button playButton;
        [SerializeField] private Button logoutButton;

        private GameProgressApiClient _gameApi;

        private readonly LoadErrorBanner _loadErrorBanner = new LoadErrorBanner();
        private readonly LoadingOverlayPresenter _loadingOverlay = new LoadingOverlayPresenter();
        private bool _bootstrapReloadRequested;
        private BootstrapLoadState _bootstrapState = BootstrapLoadState.Idle;

        private void Awake()
        {
            if (playButton == null)
                Debug.LogWarning("[MainMenuView] playButton is not assigned.");
            if (logoutButton == null)
                Debug.LogWarning("[MainMenuView] logoutButton is not assigned.");
        }

        private void Start()
        {
            playButton?.onClick.AddListener(OnPlayClicked);
            logoutButton?.onClick.AddListener(OnLogoutClicked);
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();

            if (GameSessionStateStore.TryGetLatestTotalSlices(out var cachedSlices))
                GameFlowController.Instance?.SetTotalPizzaSlices(cachedSlices);
            if (GameSessionStateStore.TryGetLatestTotalBackpackPieces(out var cachedBackpack))
                GameFlowController.Instance?.SetTotalBackpackPieces(cachedBackpack);

            if (_gameApi == null)
                return;

            var hasSnapshot = GameSessionStateStore.TryGetBootstrapSnapshot(out _);
            if (hasSnapshot && GameSessionStateStore.IsBootstrapFresh(GameSessionStateStore.DefaultBootstrapFreshSeconds))
            {
                _bootstrapState = BootstrapLoadState.Ready;
                return;
            }

            StartCoroutine(LoadPizzaRoutine(_gameApi, showBlockingOverlay: !hasSnapshot));
        }

        private void EnsureMenuErrorBanner()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
                canvas = FindAnyObjectByType<Canvas>();
            if (canvas == null)
            {
                Debug.LogError("[MainMenuView] No Canvas in parent hierarchy; load error banner cannot be created.");
                return;
            }

            UiThemeProvider.TryGet(out var tokens);
            _loadErrorBanner.Ensure(canvas, tokens);
        }

        private bool EnsureLoadingOverlay()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
                canvas = FindAnyObjectByType<Canvas>();
            if (canvas == null)
            {
                Debug.LogError("[MainMenuView] No Canvas in parent hierarchy; loading overlay cannot be created.");
                return false;
            }

            UiThemeProvider.TryGet(out var tokens);
            return _loadingOverlay.Ensure(canvas, tokens);
        }

        private IEnumerator LoadPizzaRoutine(GameProgressApiClient api, bool showBlockingOverlay)
        {
            if (_bootstrapState == BootstrapLoadState.Loading)
            {
                _bootstrapReloadRequested = true;
                yield break;
            }

            _bootstrapState = BootstrapLoadState.Loading;
            _bootstrapReloadRequested = false;
            EnsureMenuErrorBanner();
            var overlayReady = EnsureLoadingOverlay();
            _loadErrorBanner.SetRetryInteractable(false);
            if (showBlockingOverlay)
            {
                if (overlayReady)
                    _loadingOverlay.Show("Loading game data...");
                else
                    Debug.LogWarning("[MainMenuView] Blocking loading overlay unavailable; continuing with inline loading state.");
            }

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
                    if (!string.IsNullOrEmpty(err))
                        Debug.LogWarning($"[MainMenuView] Bootstrap (pizza) failed: {err}");
                    _loadErrorBanner.Show(
                        string.IsNullOrEmpty(err)
                            ? "Could not load pizza total. Is the web API running?"
                            : err,
                        () =>
                        {
                            if (_gameApi == null)
                                _gameApi = FindAnyObjectByType<GameProgressApiClient>();
                            if (_gameApi != null)
                                StartCoroutine(LoadPizzaRoutine(_gameApi, showBlockingOverlay: true));
                        });
                    yield break;
                }

                _bootstrapState = BootstrapLoadState.Ready;
                _loadErrorBanner.Hide();
                GameFlowController.Instance?.SetTotalPizzaSlices(env.totalSlices);
                GameFlowController.Instance?.SetTotalBackpackPieces(env.totalBackpackPieces);
            }
            finally
            {
                _loadingOverlay.Hide();
                _loadErrorBanner.SetRetryInteractable(true);
                if (_bootstrapReloadRequested && _gameApi != null)
                    StartCoroutine(LoadPizzaRoutine(_gameApi, showBlockingOverlay: false));
            }
        }

        private void OnPlayClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[MainMenuView] GameFlowController not found.");
                return;
            }
            GameFlowController.Instance.LoadChapterOverview();
        }

        private void OnLogoutClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[MainMenuView] GameFlowController not found.");
                return;
            }

            var api = FindAnyObjectByType<AuthApiClient>();
            if (api != null)
                StartCoroutine(LogoutRoutine(api));
            else
                FinishLogoutLocalOnly();
        }

        private IEnumerator LogoutRoutine(AuthApiClient api)
        {
            yield return api.LogoutRemote(
                onDone: FinishLogoutLocalOnly,
                onError: _ => FinishLogoutLocalOnly());
        }

        private void FinishLogoutLocalOnly()
        {
            AuthSessionStore.Clear();
            GameSessionStateStore.Clear();
            GameFlowController.Instance?.LoadAuth();
        }

        private void OnDestroy()
        {
            playButton?.onClick.RemoveListener(OnPlayClicked);
            logoutButton?.onClick.RemoveListener(OnLogoutClicked);
            _loadErrorBanner.Destroy();
            _loadingOverlay.Destroy();
        }
    }
}
