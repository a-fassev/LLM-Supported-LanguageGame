using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using LanguageGame.Application;

namespace LanguageGame.Presentation
{
    public class CityMapView : MonoBehaviour
    {
        [SerializeField] private Button mainMenuButton;

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
        private Text _runtimePizzaLabel;
        private bool _startingLevel;

        private void Start()
        {
            mainMenuButton?.onClick.AddListener(OnMainMenuClicked);
            levelButtonA?.onClick.AddListener(() => OnLevelClicked(levelSlugA, levelButtonA));
            levelButtonB?.onClick.AddListener(() => OnLevelClicked(levelSlugB, levelButtonB));
            levelButtonC?.onClick.AddListener(() => OnLevelClicked(levelSlugC, levelButtonC));

            var api = FindGameApiOrLog();
            if (api == null)
                return;

            StartCoroutine(LoadBootstrapRoutine(api));
        }

        private GameProgressApiClient FindGameApiOrLog()
        {
            var api = FindAnyObjectByType<GameProgressApiClient>();
            if (api == null)
                Debug.LogError("[CityMapView] GameProgressApiClient not found (expected on GameFlow).");
            return api;
        }

        private IEnumerator LoadBootstrapRoutine(GameProgressApiClient api)
        {
            var useCase = new LoadGameBootstrapUseCase(api);
            GameBootstrapEnvelope env = null;
            var err = string.Empty;
            yield return useCase.Run(e => env = e, m => err = m);

            if (env == null || !env.ok)
            {
                Debug.LogWarning($"[CityMapView] Bootstrap failed: {err}");
                yield break;
            }

            _bootstrap = env;
            GameFlowController.Instance?.SetTotalPizzaSlices(env.totalSlices);
            EnsureHubPizzaLabel();
            RefreshPizzaLabel();
            RefreshLevelButtons();
        }

        private void EnsureHubPizzaLabel()
        {
            if (pizzaSlicesText != null)
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
            var refFont = mainMenuButton != null
                ? mainMenuButton.GetComponentInChildren<Text>()?.font
                : Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            t.font = refFont;
            t.fontSize = 26;
            t.color = Color.white;
            t.alignment = TextAnchor.UpperLeft;
            _runtimePizzaLabel = t;
        }

        private void RefreshPizzaLabel()
        {
            var slices = GameFlowController.Instance != null ? GameFlowController.Instance.TotalPizzaSlices : 0;
            var line = $"Pizza slices: {slices}";
            if (pizzaSlicesText != null)
                pizzaSlicesText.text = line;
            if (_runtimePizzaLabel != null)
                _runtimePizzaLabel.text = line;
        }

        private void RefreshLevelButtons()
        {
            if (_bootstrap?.levels == null)
                return;

            ApplySlot(levelButtonA, lockVisualA, levelSlugA);
            ApplySlot(levelButtonB, lockVisualB, levelSlugB);
            ApplySlot(levelButtonC, lockVisualC, levelSlugC);
        }

        private void ApplySlot(Button button, GameObject lockVisual, string slug)
        {
            if (button == null || string.IsNullOrEmpty(slug))
                return;

            var level = FindLevel(slug);
            var unlocked = level != null && level.isUnlocked;
            button.interactable = unlocked && !_startingLevel;
            var g = button.targetGraphic as Graphic;
            if (g != null)
                g.color = unlocked ? Color.white : new Color(0.55f, 0.55f, 0.55f, 0.95f);

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

        private void OnLevelClicked(string slug, Button button)
        {
            if (GameFlowController.Instance == null || button == null || _startingLevel)
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

        private IEnumerator StartLevelRoutine(GameProgressApiClient api, GameLevelBootstrapDto level)
        {
            _startingLevel = true;
            RefreshLevelButtons();

            var useCase = new StartLevelRunUseCase(api);
            GameStartLevelEnvelope started = null;
            var err = string.Empty;
            yield return useCase.Run(level.id, s => started = s, m => err = m);

            _startingLevel = false;
            RefreshLevelButtons();

            if (started == null || !started.ok)
            {
                Debug.LogWarning($"[CityMapView] Start level failed: {err}");
                yield break;
            }

            GameFlowController.Instance.SetTotalPizzaSlices(started.totalSlices);
            GameFlowController.Instance.BeginServerLevel(
                started.runId,
                started.levelId,
                started.displayName,
                started.tasks,
                started.currentTaskOrderIndex,
                started.totalSlices);
        }

        private void OnDestroy()
        {
            mainMenuButton?.onClick.RemoveAllListeners();
            levelButtonA?.onClick.RemoveAllListeners();
            levelButtonB?.onClick.RemoveAllListeners();
            levelButtonC?.onClick.RemoveAllListeners();
        }
    }
}
