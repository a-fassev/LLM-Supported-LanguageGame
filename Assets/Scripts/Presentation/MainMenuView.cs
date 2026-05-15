using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class MainMenuView : MonoBehaviour
    {
        [SerializeField] private Button playButton;
        [SerializeField] private Button logoutButton;
        [SerializeField] private Text pizzaSlicesText;

        private Text _runtimePizzaHud;

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
            EnsurePizzaHud();
            var api = FindAnyObjectByType<GameProgressApiClient>();
            if (api != null)
                StartCoroutine(LoadPizzaRoutine(api));
        }

        private IEnumerator LoadPizzaRoutine(GameProgressApiClient api)
        {
            var useCase = new LoadGameBootstrapUseCase(api);
            GameBootstrapEnvelope env = null;
            var err = string.Empty;
            yield return useCase.Run(e => env = e, m => err = m);

            if (env == null || !env.ok)
            {
                if (!string.IsNullOrEmpty(err))
                    Debug.LogWarning($"[MainMenuView] Bootstrap (pizza) failed: {err}");
                yield break;
            }

            GameFlowController.Instance?.SetTotalPizzaSlices(env.totalSlices);
            RefreshPizzaLabel();
        }

        private void EnsurePizzaHud()
        {
            if (pizzaSlicesText != null || _runtimePizzaHud != null)
                return;

            var canvas = GetComponentInParent<Canvas>();
            if (canvas == null)
                return;

            var go = new GameObject("PizzaSlicesHud", typeof(RectTransform));
            go.transform.SetParent(canvas.transform, false);
            var rt = go.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0f, 1f);
            rt.anchorMax = new Vector2(0f, 1f);
            rt.pivot = new Vector2(0f, 1f);
            rt.anchoredPosition = new Vector2(24f, -24f);
            rt.sizeDelta = new Vector2(520f, 40f);

            var t = go.AddComponent<Text>();
            var refFont = playButton != null
                ? playButton.GetComponentInChildren<Text>()?.font
                : Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.font = refFont;
            t.fontSize = 26;
            t.color = Color.white;
            t.alignment = TextAnchor.UpperLeft;
            _runtimePizzaHud = t;
        }

        private void RefreshPizzaLabel()
        {
            var slices = GameFlowController.Instance != null ? GameFlowController.Instance.TotalPizzaSlices : 0;
            var line = $"Pizza slices: {slices}";
            if (pizzaSlicesText != null)
                pizzaSlicesText.text = line;
            if (_runtimePizzaHud != null)
                _runtimePizzaHud.text = line;
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
            logoutButton?.onClick.RemoveListener(OnLogoutClicked);
        }
    }
}
