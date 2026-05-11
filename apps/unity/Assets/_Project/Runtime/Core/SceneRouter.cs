using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace ITBL.LanguageGame.Runtime.Core
{
    public sealed class SceneRouter : ISceneRouter
    {
        private readonly Dictionary<GameSceneId, string> _sceneNames = new()
        {
            { GameSceneId.Bootstrap, SceneNames.Bootstrap },
            { GameSceneId.MainMenu, SceneNames.MainMenu },
            { GameSceneId.MainHub, SceneNames.MainHub },
            { GameSceneId.LevelTemplate, SceneNames.LevelTemplate },
        };

        private readonly UserFacingErrorState _errorState;

        public SceneRouter(UserFacingErrorState errorState)
        {
            _errorState = errorState;
        }

        public bool IsLoading { get; private set; }
        public event Action<bool> LoadingStateChanged;

        public bool TryGetSceneName(GameSceneId sceneId, out string sceneName)
        {
            return _sceneNames.TryGetValue(sceneId, out sceneName);
        }

        public async void LoadScene(GameSceneId sceneId)
        {
            if (IsLoading)
            {
                return;
            }

            if (!TryGetSceneName(sceneId, out string sceneName))
            {
                _errorState.Report(AppErrorCode.SceneLoadFailed, $"Scene mapping missing for {sceneId}");
                return;
            }

            IsLoading = true;
            LoadingStateChanged?.Invoke(true);
            Debug.Log($"[WP1][SceneRouter] Loading {sceneName}");

            AsyncOperation operation;
            try
            {
                operation = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Single);
            }
            catch (Exception exception)
            {
                _errorState.Report(AppErrorCode.SceneLoadFailed, exception.Message);
                IsLoading = false;
                LoadingStateChanged?.Invoke(false);
                return;
            }

            if (operation == null)
            {
                _errorState.Report(AppErrorCode.SceneLoadFailed, "LoadSceneAsync returned null");
                IsLoading = false;
                LoadingStateChanged?.Invoke(false);
                return;
            }

            while (!operation.isDone)
            {
                await Awaitable.NextFrameAsync();
            }

            IsLoading = false;
            LoadingStateChanged?.Invoke(false);
        }
    }
}
