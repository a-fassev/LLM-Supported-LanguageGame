using System.Collections;
using LanguageGame.Application;
using UnityEngine;
using UnityEngine.UIElements;

namespace LanguageGame.Presentation
{
    /// <summary>Main menu using UI Toolkit menus theme.</summary>
    public sealed class MainMenuView : MonoBehaviour
    {
        private enum BootstrapLoadState
        {
            Idle,
            Loading,
            Ready,
            Error
        }

        private UIDocument _doc;

        private GameProgressApiClient _gameApi;

        private readonly LearningToolkitLoadingOverlay _loadingOverlay = new LearningToolkitLoadingOverlay();

        private readonly LearningToolkitLoadErrorBanner _loadErrorBanner = new LearningToolkitLoadErrorBanner();

        private bool _bootstrapReloadRequested;

        private BootstrapLoadState _bootstrapState = BootstrapLoadState.Idle;

        private void Awake()
        {
            _doc = LearningToolkitBootstrap.SpawnUiDocument(this, "MainMenuScreen");
            if (_doc == null)
            {
                Debug.LogError("[MainMenuView] UI Toolkit bootstrap failed — check Resources paths and PanelSettings.");
                enabled = false;
                return;
            }

            AttachOverlays();

            VisualElement root = _doc.rootVisualElement;

            root.Q<Button>("play-button")?.RegisterCallback<ClickEvent>(_ => OnPlayClicked());
            root.Q<Button>("logout-button")?.RegisterCallback<ClickEvent>(_ => OnLogoutClicked());

            if (GameSessionStateStore.TryGetLatestTotalSlices(out var cachedSlices))
                GameFlowController.Instance?.SetTotalPizzaSlices(cachedSlices);

            if (GameSessionStateStore.TryGetLatestTotalBackpackPieces(out var cachedBackpack))
                GameFlowController.Instance?.SetTotalBackpackPieces(cachedBackpack);

            AttemptResolveGameApiAndMaybeBootstrap();
        }

        /// <summary>Re-fetch <see cref="GameProgressApiClient"/> and continue bootstrap flow; invoked from banners and retries.</summary>
        private void AttemptResolveGameApiAndMaybeBootstrap()
        {
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();

            if (_gameApi == null)
            {
                Debug.LogWarning("[MainMenuView] GameProgressApiClient not found.");

                _bootstrapState = BootstrapLoadState.Idle;

                _loadErrorBanner.Show(
                    "GameProgressApiClient was not found on the GameFlow object — add it here or Retry.",
                    AttemptResolveGameApiAndMaybeBootstrap);

                return;
            }

            _loadErrorBanner.Hide();

            bool hasSnapshot = GameSessionStateStore.TryGetBootstrapSnapshot(out _);
            if (hasSnapshot && GameSessionStateStore.IsBootstrapFresh(GameSessionStateStore.DefaultBootstrapFreshSeconds))
            {
                _bootstrapState = BootstrapLoadState.Ready;
                return;
            }

            StartCoroutine(LoadPizzaRoutine(_gameApi, showBlockingOverlay: !hasSnapshot));
        }

        private void AttachOverlays()
        {
            VisualElement overlayPlane = LearningToolkitBootstrap.ResolveOverlayPlane(_doc);
            if (overlayPlane == null)
            {
                Debug.LogError("[MainMenuView] overlay-plane missing in MainMenu UI definition.");
                return;
            }

            _loadingOverlay.Attach(overlayPlane);
            _loadErrorBanner.Attach(overlayPlane);
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
            _loadErrorBanner.SetRetryInteractable(false);

            if (showBlockingOverlay)
                _loadingOverlay.Show("Loading game data…");
            else
                _loadingOverlay.Hide();

            try
            {
                _loadErrorBanner.Hide();
                var useCase = new LoadGameBootstrapUseCase(api);
                GameBootstrapEnvelope env = null;
                string err = string.Empty;
                yield return useCase.Run(e => env = e, m => err = m);

                if (env == null || !env.ok)
                {
                    _bootstrapState = BootstrapLoadState.Error;

                    string message = string.IsNullOrEmpty(err)
                        ? "Couldn't load game bootstrap. Did you run the classroom server (npm run dev) next door?"
                        : err;

                    if (!string.IsNullOrEmpty(err))
                        Debug.LogWarning($"[MainMenuView] Bootstrap failed: {err}");

                    if (GameProgressApiClient.LooksLikeSessionAuthFailure(err))
                    {
                        GameFlowController.Instance?.LoadAuth();
                        yield break;
                    }

                    _loadErrorBanner.Show(
                        message,
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
            if (_bootstrapState == BootstrapLoadState.Loading)
                return;

            GameFlowController flow = GameFlowController.Instance;
            if (flow == null)
            {
                Debug.LogError("[MainMenuView] GameFlowController not found.");

                _loadErrorBanner.Show(
                    "Navigation is not wired correctly. Check GameFlowController on the bootstrap object.",
                    RetryAfterFlowNavigationMissing);

                return;
            }

            flow.LoadChapterOverview();
        }

        private void RetryAfterFlowNavigationMissing()
        {
            if (GameFlowController.Instance != null)
            {
                _loadErrorBanner.Hide();
                return;
            }

            Debug.LogWarning("[MainMenuView] Retry: GameFlowController still unavailable.");

            _loadErrorBanner.Show(
                    "Navigation is not wired correctly. Check GameFlowController on the bootstrap object.",
                    RetryAfterFlowNavigationMissing);
        }

        private void OnLogoutClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[MainMenuView] GameFlowController not found.");

                _loadErrorBanner.Show(
                    "Navigation is not wired correctly. Check GameFlowController on the bootstrap object.",
                    RetryAfterFlowNavigationMissing);

                return;
            }

            AuthApiClient api = FindAnyObjectByType<AuthApiClient>();
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

        private static void FinishLogoutLocalOnly()
        {
            AuthSessionStore.Clear();
            GameSessionStateStore.Clear();
            GameFlowController.Instance?.LoadAuth();
        }

        private void OnDestroy()
        {
            _loadErrorBanner.Destroy();
            _loadingOverlay.Destroy();

            if (_doc != null)
                Destroy(_doc.gameObject);
        }
    }
}
