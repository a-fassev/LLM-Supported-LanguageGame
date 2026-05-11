using System;

namespace ITBL.LanguageGame.Runtime.Core
{
    public interface ISceneRouter
    {
        bool IsLoading { get; }
        event Action<bool> LoadingStateChanged;
        bool TryGetSceneName(GameSceneId sceneId, out string sceneName);
        void LoadScene(GameSceneId sceneId);
    }
}
