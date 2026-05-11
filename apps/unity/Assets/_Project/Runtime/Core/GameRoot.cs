using ITBL.LanguageGame.Runtime.Game.Hub;
using ITBL.LanguageGame.Runtime.Game.Levels;
using ITBL.LanguageGame.Runtime.Infrastructure.Networking;
using ITBL.LanguageGame.Runtime.Infrastructure.Persistence;
using System;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace ITBL.LanguageGame.Runtime.Core
{
    public sealed class GameRoot : MonoBehaviour
    {
        private static GameRoot _instance;

        public static bool IsReady => _instance != null && Services != null;
        public static GameServices Services { get; private set; }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void EnsureExists()
        {
            if (_instance != null)
            {
                return;
            }

            GameObject rootObject = new("GameRoot");
            _instance = rootObject.AddComponent<GameRoot>();
            DontDestroyOnLoad(rootObject);
        }

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }

            _instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeServices();
        }

        private void OnEnable()
        {
            SceneManager.sceneLoaded += OnSceneLoaded;
        }

        private void OnDisable()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        private void InitializeServices()
        {
            if (Services != null)
            {
                return;
            }

            UserFacingErrorState errorState = new();
            SceneRouter sceneRouter = new(errorState);
            GameAppState appState = new();

            JsonSaveStore saveStore = new(errorState);
            GameRuntimeConfig runtimeConfig = Resources.Load<GameRuntimeConfig>("GameRuntimeConfig");
            if (runtimeConfig == null)
            {
                runtimeConfig = GameRuntimeConfig.CreateDefaultInstance();
            }

            ErrorMessageCatalog.SetRuntimeOverrides(runtimeConfig.errorMessageOverrides);

            string envPersistence = Environment.GetEnvironmentVariable("ITBL_PERSISTENCE_PROVIDER");
            string persistenceProvider = string.IsNullOrWhiteSpace(envPersistence)
                ? runtimeConfig.persistenceProviderWhenEnvUnset
                : envPersistence;
            PersistenceRepositories repositories = PersistenceRepositoryFactory.Create(persistenceProvider, saveStore);
            IProgressionService progressionService = new ProgressionService(
                repositories.ProgressRepository,
                repositories.PlayerProfileRepository,
                LevelCatalogProvider.Load());

            TaskEvaluationApiClientConfig apiConfig = new()
            {
                EndpointUrl = runtimeConfig.taskEvaluationEndpointUrl,
                ApiKey = runtimeConfig.taskEvaluationApiKey,
                TimeoutSeconds = runtimeConfig.taskEvaluationTimeoutSeconds,
                MaxRetries = runtimeConfig.taskEvaluationMaxRetries,
            };
            ITaskEvaluationApiClient taskEvaluationApiClient = new TaskEvaluationApiClient(apiConfig);

            Services = new GameServices(sceneRouter, progressionService, appState, errorState, taskEvaluationApiClient, runtimeConfig);
        }

        private void OnSceneLoaded(Scene scene, LoadSceneMode _)
        {
            if (Services == null)
            {
                return;
            }

            Services.AppState.CurrentSceneId = ToSceneId(scene.name);
            switch (Services.AppState.CurrentSceneId)
            {
                case GameSceneId.Bootstrap:
                    EnsureController<GameBootstrap>("BootstrapController");
                    break;
                case GameSceneId.MainMenu:
                    EnsureController<MainMenuSceneController>("MainMenuController");
                    break;
                case GameSceneId.MainHub:
                    EnsureController<HubSceneController>("MainHubController");
                    break;
                case GameSceneId.LevelTemplate:
                    EnsureController<LevelSceneController>("LevelController");
                    break;
            }
        }

        private static void EnsureController<T>(string gameObjectName) where T : Component
        {
            if (FindAnyObjectByType<T>() != null)
            {
                return;
            }

            GameObject holder = new(gameObjectName);
            holder.AddComponent<T>();
        }

        private static GameSceneId ToSceneId(string sceneName)
        {
            return sceneName switch
            {
                SceneNames.Bootstrap => GameSceneId.Bootstrap,
                SceneNames.MainMenu => GameSceneId.MainMenu,
                SceneNames.MainHub => GameSceneId.MainHub,
                SceneNames.LevelTemplate => GameSceneId.LevelTemplate,
                _ => GameSceneId.Bootstrap,
            };
        }

        private void OnGUI()
        {
            if (Services == null)
            {
                return;
            }

            if (Services.SceneRouter.IsLoading)
            {
                GUI.Box(new Rect(15, 15, 260, 40), "Lade Szene ...");
            }

            if (Services.ErrorState.HasError)
            {
                GUI.Box(new Rect(15, 65, 500, 130), Services.ErrorState.CurrentMessage);
                if (GUI.Button(new Rect(25, 115, 170, 30), "Zum Hub zurueck"))
                {
                    Services.ErrorState.Clear();
                    Services.SceneRouter.LoadScene(GameSceneId.MainHub);
                }

                if (GUI.Button(new Rect(205, 115, 170, 30), "Zum Menue"))
                {
                    Services.ErrorState.Clear();
                    Services.SceneRouter.LoadScene(GameSceneId.MainMenu);
                }
            }
        }
    }
}
