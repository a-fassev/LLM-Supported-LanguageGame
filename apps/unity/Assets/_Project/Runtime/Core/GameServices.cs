using ITBL.LanguageGame.Runtime.Game.Levels;
using ITBL.LanguageGame.Runtime.Infrastructure.Networking;

namespace ITBL.LanguageGame.Runtime.Core
{
    public sealed class GameServices
    {
        public GameServices(
            ISceneRouter sceneRouter,
            IProgressionService progressionService,
            GameAppState appState,
            UserFacingErrorState errorState,
            ITaskEvaluationApiClient taskEvaluationApiClient,
            GameRuntimeConfig runtimeConfig)
        {
            SceneRouter = sceneRouter;
            ProgressionService = progressionService;
            AppState = appState;
            ErrorState = errorState;
            TaskEvaluationApiClient = taskEvaluationApiClient;
            RuntimeConfig = runtimeConfig;
        }

        public ISceneRouter SceneRouter { get; }
        public IProgressionService ProgressionService { get; }
        public GameAppState AppState { get; }
        public UserFacingErrorState ErrorState { get; }
        public ITaskEvaluationApiClient TaskEvaluationApiClient { get; }
        public GameRuntimeConfig RuntimeConfig { get; }
    }
}
