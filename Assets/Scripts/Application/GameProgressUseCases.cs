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

    public sealed class StartQuestRunUseCase
    {
        private readonly GameProgressApiClient _api;

        public StartQuestRunUseCase(GameProgressApiClient api)
        {
            _api = api;
        }

        public IEnumerator Run(string questId, Action<GameStartQuestEnvelope> onOk, Action<string> onError)
        {
            var e = _api.StartQuest(
                questId,
                started =>
                {
                    GameSessionStateStore.ApplyStartQuestResult(started);
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

        public IEnumerator Run(string runId, string stepId, Action<GameCompleteTaskEnvelope> onOk,
            Action<string> onError, string evaluationGateToken = null)
        {
            var e = _api.CompleteStepTask(
                runId,
                stepId,
                done =>
                {
                    GameSessionStateStore.ApplyTaskCompletion(done);
                    onOk?.Invoke(done);
                },
                onError,
                evaluationGateToken);
            while (e.MoveNext())
                yield return e.Current;
        }
    }

    public sealed class AdvanceCutsceneUseCase
    {
        private readonly GameProgressApiClient _api;

        public AdvanceCutsceneUseCase(GameProgressApiClient api)
        {
            _api = api;
        }

        public IEnumerator Run(string runId, string stepId, Action<GameCompleteTaskEnvelope> onOk,
            Action<string> onError)
        {
            var e = _api.AdvanceCutsceneStep(
                runId,
                stepId,
                done =>
                {
                    if (done != null && done.ok)
                    {
                        GameSessionStateStore.SetLatestWalletTotals(done.totalSlices, done.totalBackpackPieces);
                    }
                    onOk?.Invoke(done);
                },
                onError);
            while (e.MoveNext())
                yield return e.Current;
        }
    }

    public sealed class FinishQuestRunUseCase
    {
        private readonly GameProgressApiClient _api;

        public FinishQuestRunUseCase(GameProgressApiClient api)
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
