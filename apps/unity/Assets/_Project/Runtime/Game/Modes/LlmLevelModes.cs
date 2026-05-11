using System.Threading;
using System.Threading.Tasks;
using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.Game.Content;
using ITBL.LanguageGame.Runtime.Infrastructure.Networking;

namespace ITBL.LanguageGame.Runtime.Game.Modes
{
    public sealed class LlmFreeTextMode : ILevelMode
    {
        private readonly ITaskEvaluationApiClient _apiClient;

        public LlmFreeTextMode(ITaskEvaluationApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        public TaskType SupportedType => TaskType.LlmFreeText;

        public async Task<TaskResult> EvaluateAsync(
            LevelTaskDefinition task,
            TaskSubmission submission,
            CancellationToken cancellationToken = default)
        {
            TaskEvaluationApiResponse response = await _apiClient.EvaluateAsync(task, submission, cancellationToken);
            if (response.IsSuccess && response.Result != null)
            {
                return response.Result;
            }

            return new TaskResult
            {
                IsEvaluationError = true,
                ErrorCode = response.ErrorCode == AppErrorCode.None ? AppErrorCode.ApiUnavailable : response.ErrorCode,
                RetryRecommended = response.Retryable,
                ScoreEarned = 0,
                ScoreMax = task?.scoring?.maxPoints > 0 ? task.scoring.maxPoints : 1,
                Feedback = string.IsNullOrWhiteSpace(response.Message)
                    ? ErrorMessageCatalog.Resolve(AppErrorCode.ApiUnavailable)
                    : response.Message,
            };
        }
    }

    public sealed class LlmWordGuessMode : ILevelMode
    {
        private readonly ITaskEvaluationApiClient _apiClient;

        public LlmWordGuessMode(ITaskEvaluationApiClient apiClient)
        {
            _apiClient = apiClient;
        }

        public TaskType SupportedType => TaskType.LlmWordGuess;

        public async Task<TaskResult> EvaluateAsync(
            LevelTaskDefinition task,
            TaskSubmission submission,
            CancellationToken cancellationToken = default)
        {
            TaskEvaluationApiResponse response = await _apiClient.EvaluateAsync(task, submission, cancellationToken);
            if (response.IsSuccess && response.Result != null)
            {
                return response.Result;
            }

            return new TaskResult
            {
                IsEvaluationError = true,
                ErrorCode = response.ErrorCode == AppErrorCode.None ? AppErrorCode.ApiUnavailable : response.ErrorCode,
                RetryRecommended = response.Retryable,
                ScoreEarned = 0,
                ScoreMax = task?.scoring?.maxPoints > 0 ? task.scoring.maxPoints : 1,
                Feedback = string.IsNullOrWhiteSpace(response.Message)
                    ? ErrorMessageCatalog.Resolve(AppErrorCode.ApiUnavailable)
                    : response.Message,
            };
        }
    }
}
