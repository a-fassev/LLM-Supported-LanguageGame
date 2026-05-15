using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class MainMenuView : MonoBehaviour
    {
        [SerializeField] private Button playButton;
        [SerializeField] private Button avatarShopButton;
        [SerializeField] private Button logoutButton;
        [SerializeField] private Text pizzaSlicesText;

        private GameProgressApiClient _gameApi;

        private readonly LoadErrorBanner _loadErrorBanner = new LoadErrorBanner();
        private bool _pizzaBootstrapInFlight;

        private void Awake()
        {
            if (playButton == null)
                Debug.LogWarning("[MainMenuView] playButton is not assigned.");
            if (avatarShopButton == null)
                Debug.LogWarning("[MainMenuView] avatarShopButton is not assigned.");
            if (logoutButton == null)
                Debug.LogWarning("[MainMenuView] logoutButton is not assigned.");
        }

        private void Start()
        {
            playButton?.onClick.AddListener(OnPlayClicked);
            avatarShopButton?.onClick.AddListener(OnAvatarShopClicked);
            logoutButton?.onClick.AddListener(OnLogoutClicked);
            _gameApi = FindAnyObjectByType<GameProgressApiClient>();
            if (_gameApi != null)
                StartCoroutine(LoadPizzaRoutine(_gameApi));
        }

        private void EnsureMenuErrorBanner()
        {
            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
            {
                Debug.LogError("[MainMenuView] No Canvas in parent hierarchy; load error banner cannot be created.");
                return;
            }

            var refFont = playButton != null
                ? playButton.GetComponentInChildren<Text>()?.font
                : null;
            _loadErrorBanner.Ensure(canvas, refFont, 100f, 0.72f, 0.74f, 0.97f, 20f);
        }

        private IEnumerator LoadPizzaRoutine(GameProgressApiClient api)
        {
            if (_pizzaBootstrapInFlight)
                yield break;

            _pizzaBootstrapInFlight = true;
            EnsureMenuErrorBanner();
            _loadErrorBanner.SetRetryInteractable(false);
            try
            {
                _loadErrorBanner.Hide();
                var useCase = new LoadGameBootstrapUseCase(api);
                GameBootstrapEnvelope env = null;
                var err = string.Empty;
                yield return useCase.Run(e => env = e, m => err = m);

                if (env == null || !env.ok)
                {
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
                                StartCoroutine(LoadPizzaRoutine(_gameApi));
                        });
                    yield break;
                }

                _loadErrorBanner.Hide();
                GameFlowController.Instance?.SetTotalPizzaSlices(env.totalSlices);
                RefreshPizzaLabel();
            }
            finally
            {
                _pizzaBootstrapInFlight = false;
                _loadErrorBanner.SetRetryInteractable(true);
            }
        }

        private void RefreshPizzaLabel()
        {
            var slices = GameFlowController.Instance != null ? GameFlowController.Instance.TotalPizzaSlices : 0;
            var line = $"Pizza slices: {slices}";
            if (pizzaSlicesText != null)
                pizzaSlicesText.text = line;
        }

        private void OnPlayClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[MainMenuView] GameFlowController not found.");
                return;
            }
            GameFlowController.Instance.LoadCityMap();
        }

        private void OnAvatarShopClicked()
        {
            if (GameFlowController.Instance == null)
            {
                Debug.LogError("[MainMenuView] GameFlowController not found.");
                return;
            }
            GameFlowController.Instance.LoadAvatarShopFromMainMenu();
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
            GameFlowController.Instance?.LoadAuth();
        }

        private void OnDestroy()
        {
            playButton?.onClick.RemoveListener(OnPlayClicked);
            avatarShopButton?.onClick.RemoveListener(OnAvatarShopClicked);
            logoutButton?.onClick.RemoveListener(OnLogoutClicked);
            _loadErrorBanner.Destroy();
        }
    }
}
