using System;
using System.Collections;

namespace LanguageGame.Application
{
    /// <summary>
    /// Application-layer entry points for game progress (presentation calls these, not raw HTTP).
    /// </summary>
    public sealed class LoadGameBootstrapUseCase
    {
        private readonly GameProgressApiClient _api;

        public LoadGameBootstrapUseCase(GameProgressApiClient api)
        {
            _api = api;
        }

        public IEnumerator Run(Action<GameBootstrapEnvelope> onOk, Action<string> onError)
        {
            var e = _api.GetBootstrap(
                env =>
                {
                    if (env != null && env.ok)
                        GameSessionStateStore.SetBootstrapSnapshot(env);
                    onOk?.Invoke(env);
                },
                onError);
            while (e.MoveNext())
                yield return e.Current;
        }
    }

    public sealed class StartLevelRunUseCase
    {
        private readonly GameProgressApiClient _api;

        public StartLevelRunUseCase(GameProgressApiClient api)
        {
            _api = api;
        }

        public IEnumerator Run(string levelId, Action<GameStartLevelEnvelope> onOk, Action<string> onError)
        {
            var e = _api.StartLevel(
                levelId,
                started =>
                {
                    GameSessionStateStore.ApplyStartLevelResult(started);
                    onOk?.Invoke(started);
                },
                onError);
            while (e.MoveNext())
                yield return e.Current;
        }
    }

    public sealed class CompleteTaskUseCase
    {
        private readonly GameProgressApiClient _api;

        public CompleteTaskUseCase(GameProgressApiClient api)
        {
            _api = api;
        }

        public IEnumerator Run(string runId, string taskId, Action<GameCompleteTaskEnvelope> onOk,
            Action<string> onError)
        {
            var e = _api.CompleteTask(
                runId,
                taskId,
                done =>
                {
                    GameSessionStateStore.ApplyTaskCompletion(done);
                    onOk?.Invoke(done);
                },
                onError);
            while (e.MoveNext())
                yield return e.Current;
        }
    }

    public sealed class FinishLevelRunUseCase
    {
        private readonly GameProgressApiClient _api;

        public FinishLevelRunUseCase(GameProgressApiClient api)
        {
            _api = api;
        }

        public IEnumerator Run(string runId, Action<GameFinishEnvelope> onOk, Action<string> onError)
        {
            var e = _api.FinishRun(
                runId,
                done =>
                {
                    GameSessionStateStore.ApplyRunFinished(done);
                    onOk?.Invoke(done);
                },
                onError);
            while (e.MoveNext())
                yield return e.Current;
        }
    }
}
