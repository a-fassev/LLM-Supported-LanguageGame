using System;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.Game.Content;
using ITBL.LanguageGame.Runtime.Game.Modes;
using UnityEngine;
using UnityEngine.Networking;

namespace ITBL.LanguageGame.Runtime.Infrastructure.Networking
{
    [Serializable]
    internal sealed class TaskEvaluationSubmissionDto
    {
        public string rawText = string.Empty;
        public string[] values = Array.Empty<string>();
        public int attemptNumber = 1;
    }

    [Serializable]
    internal sealed class TaskEvaluationScoringDto
    {
        public string policy = "strict_binary";
        public int maxPoints = 1;
        public float passThreshold = 1f;
    }

    [Serializable]
    internal sealed class TaskEvaluationRequestDto
    {
        public int contractVersion = 1;
        public string sessionId = string.Empty;
        public string attemptId = string.Empty;
        public string levelId = string.Empty;
        public string taskId = string.Empty;
        public string promptText = string.Empty;
        public string taskType = string.Empty;
        public TaskEvaluationSubmissionDto submission = new();
        public TaskEvaluationScoringDto scoring = new();
        public string[] evaluationCriteria = Array.Empty<string>();
        public string[] targetStructures = Array.Empty<string>();
        public string targetWord = string.Empty;
        public int maxGuessAttempts = 1;
    }

    [Serializable]
    internal sealed class TaskEvaluationDetailsDto
    {
        public int criteriaMatched;
        public int criteriaTotal;
        public string nextStep = string.Empty;
        public bool isCorrect;
        public int remainingAttempts;
        public string hint = string.Empty;
    }

    [Serializable]
    internal sealed class TaskEvaluationSuccessDto
    {
        public string requestId = string.Empty;
        public string taskId = string.Empty;
        public string taskType = string.Empty;
        public bool isPass;
        public int scoreEarned;
        public int scoreMax = 1;
        public string feedback = string.Empty;
        public TaskEvaluationDetailsDto details;
    }

    [Serializable]
    internal sealed class TaskEvaluationErrorDto
    {
        public string requestId = string.Empty;
        public string code = string.Empty;
        public string message = string.Empty;
        public bool retryable;
    }

    [Serializable]
    public sealed class TaskEvaluationApiClientConfig
    {
        public string EndpointUrl = "/api/tasks/evaluate";
        public string ApiKey = string.Empty;
        public int TimeoutSeconds = 12;
        public int MaxRetries = 1;
    }

    public sealed class TaskEvaluationApiResponse
    {
        public bool IsSuccess { get; set; }
        public AppErrorCode ErrorCode { get; set; } = AppErrorCode.None;
        public bool Retryable { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public TaskResult Result { get; set; }
    }

    public interface ITaskEvaluationApiClient
    {
        Task<TaskEvaluationApiResponse> EvaluateAsync(
            LevelTaskDefinition task,
            TaskSubmission submission,
            CancellationToken cancellationToken = default);
    }

    public sealed class TaskEvaluationApiClient : ITaskEvaluationApiClient
    {
        private readonly TaskEvaluationApiClientConfig _config;

        public TaskEvaluationApiClient(TaskEvaluationApiClientConfig config)
        {
            _config = config ?? new TaskEvaluationApiClientConfig();
        }

        public async Task<TaskEvaluationApiResponse> EvaluateAsync(
            LevelTaskDefinition task,
            TaskSubmission submission,
            CancellationToken cancellationToken = default)
        {
            if (task == null || submission == null)
            {
                return Fail(AppErrorCode.TaskConfigInvalid, "Taskdaten sind unvollstaendig.", retryable: false);
            }

            string payload = JsonUtility.ToJson(BuildRequest(task, submission));
            int attempts = Math.Max(0, _config.MaxRetries) + 1;
            for (int attemptIndex = 0; attemptIndex < attempts; attemptIndex++)
            {
                TaskEvaluationApiResponse response = await SendOnceAsync(payload, cancellationToken);
                if (response.IsSuccess)
                {
                    return response;
                }

                bool hasRetry = attemptIndex < attempts - 1;
                if (!hasRetry || !response.Retryable)
                {
                    return response;
                }
            }

            return Fail(AppErrorCode.ApiUnavailable, "Der Bewertungsdienst ist aktuell nicht verfuegbar.", retryable: true);
        }

        private async Task<TaskEvaluationApiResponse> SendOnceAsync(string payload, CancellationToken cancellationToken)
        {
            string endpointUrl = ResolveEndpointUrl(_config.EndpointUrl);
            using UnityWebRequest request = new(endpointUrl, UnityWebRequest.kHttpVerbPOST);
            request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(payload));
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            if (!string.IsNullOrWhiteSpace(_config.ApiKey))
            {
                request.SetRequestHeader("x-task-eval-api-key", _config.ApiKey.Trim());
            }
            request.timeout = Math.Max(1, _config.TimeoutSeconds);

            CancellationTokenRegistration cancelRegistration = cancellationToken.Register(() =>
            {
                try
                {
                    request.Abort();
                }
                catch
                {
                    // ignored — request may already be completed or disposed.
                }
            });

            try
            {
                UnityWebRequestAsyncOperation operation = request.SendWebRequest();
                while (!operation.isDone)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    await Task.Yield();
                }
            }
            finally
            {
                cancelRegistration.Dispose();
            }

            long statusCode = request.responseCode;
            if (request.result == UnityWebRequest.Result.ConnectionError)
            {
                return MapTransportFailure(request.error);
            }

            if (statusCode >= 200 && statusCode < 300)
            {
                TaskEvaluationSuccessDto success;
                try
                {
                    success = JsonUtility.FromJson<TaskEvaluationSuccessDto>(request.downloadHandler.text);
                }
                catch
                {
                    return Fail(AppErrorCode.ApiInvalidResponse, "Die Rueckmeldung war unvollstaendig. Bitte erneut versuchen.", retryable: true);
                }

                if (success == null || string.IsNullOrWhiteSpace(success.feedback))
                {
                    return Fail(AppErrorCode.ApiInvalidResponse, "Die Rueckmeldung war unvollstaendig. Bitte erneut versuchen.", retryable: true);
                }

                return new TaskEvaluationApiResponse
                {
                    IsSuccess = true,
                    Result = new TaskResult
                    {
                        IsPass = success.isPass,
                        ScoreEarned = Mathf.Max(0, success.scoreEarned),
                        ScoreMax = Mathf.Max(1, success.scoreMax),
                        Feedback = success.feedback,
                    },
                };
            }

            TaskEvaluationErrorDto error = null;
            try
            {
                error = JsonUtility.FromJson<TaskEvaluationErrorDto>(request.downloadHandler.text);
            }
            catch
            {
                // ignored: mapped below via status fallback.
            }

            return MapError(statusCode, error);
        }

        private static string ResolveEndpointUrl(string endpointUrl)
        {
            string normalized = string.IsNullOrWhiteSpace(endpointUrl)
                ? "/api/tasks/evaluate"
                : endpointUrl.Trim();

            if (Uri.TryCreate(normalized, UriKind.Absolute, out Uri absoluteUri))
            {
                return absoluteUri.ToString();
            }

            if (!normalized.StartsWith("/", StringComparison.Ordinal))
            {
                normalized = $"/{normalized}";
            }

            if (TryGetApplicationOrigin(out string origin))
            {
                return $"{origin}{normalized}";
            }

            return $"http://localhost:3000{normalized}";
        }

        private static bool TryGetApplicationOrigin(out string origin)
        {
            origin = string.Empty;
            string absoluteUrl = Application.absoluteURL;
            if (string.IsNullOrWhiteSpace(absoluteUrl))
            {
                return false;
            }

            if (!Uri.TryCreate(absoluteUrl, UriKind.Absolute, out Uri uri))
            {
                return false;
            }

            origin = $"{uri.Scheme}://{uri.Authority}";
            return true;
        }

        private TaskEvaluationRequestDto BuildRequest(LevelTaskDefinition task, TaskSubmission submission)
        {
            TaskEvaluationRequestDto request = new()
            {
                contractVersion = submission.ContractVersion <= 0 ? 1 : submission.ContractVersion,
                sessionId = string.IsNullOrWhiteSpace(submission.SessionId) ? submission.AttemptId : submission.SessionId,
                attemptId = submission.AttemptId,
                levelId = submission.LevelId,
                taskId = string.IsNullOrWhiteSpace(submission.TaskId) ? task.taskId : submission.TaskId,
                promptText = string.IsNullOrWhiteSpace(submission.PromptText) ? task.prompt : submission.PromptText,
                taskType = task.taskType,
                scoring = new TaskEvaluationScoringDto
                {
                    policy = task.scoring.policy,
                    maxPoints = task.scoring.maxPoints,
                    passThreshold = task.scoring.passThreshold,
                },
                submission = new TaskEvaluationSubmissionDto
                {
                    rawText = submission.RawText ?? string.Empty,
                    values = submission.Values.ToArray(),
                    attemptNumber = submission.AttemptNumber <= 0 ? 1 : submission.AttemptNumber,
                },
            };

            if (task.ResolveTaskType() == TaskType.LlmFreeText)
            {
                request.evaluationCriteria = task.evaluationCriteria.ToArray();
                request.targetStructures = task.targetStructures.ToArray();
            }
            else if (task.ResolveTaskType() == TaskType.LlmWordGuess)
            {
                request.targetWord = task.targetWord;
                request.maxGuessAttempts = task.maxGuessAttempts;
            }

            return request;
        }

        private static TaskEvaluationApiResponse MapTransportFailure(string transportError)
        {
            bool timedOut = !string.IsNullOrWhiteSpace(transportError)
                && transportError.IndexOf("timed out", StringComparison.OrdinalIgnoreCase) >= 0;

            if (timedOut)
            {
                return Fail(AppErrorCode.NetworkTimeout, ErrorMessageCatalog.Resolve(AppErrorCode.NetworkTimeout), retryable: true);
            }

            return Fail(AppErrorCode.ApiUnavailable, ErrorMessageCatalog.Resolve(AppErrorCode.ApiUnavailable), retryable: true);
        }

        private static TaskEvaluationApiResponse MapError(long statusCode, TaskEvaluationErrorDto error)
        {
            if (error != null && !string.IsNullOrWhiteSpace(error.code))
            {
                return error.code switch
                {
                    "INVALID_JSON" => Fail(AppErrorCode.TaskConfigInvalid, ErrorMessageCatalog.Resolve(AppErrorCode.TaskConfigInvalid), retryable: false),
                    "UNAUTHORIZED" => Fail(AppErrorCode.TaskConfigInvalid, ErrorMessageCatalog.Resolve(AppErrorCode.TaskConfigInvalid), retryable: error.retryable),
                    "MODEL_TIMEOUT" => Fail(AppErrorCode.NetworkTimeout, ErrorMessageCatalog.Resolve(AppErrorCode.NetworkTimeout), retryable: error.retryable),
                    "PROVIDER_UNAVAILABLE" => Fail(AppErrorCode.ApiUnavailable, ErrorMessageCatalog.Resolve(AppErrorCode.ApiUnavailable), retryable: error.retryable),
                    "INVALID_MODEL_OUTPUT" => Fail(AppErrorCode.ApiInvalidResponse, ErrorMessageCatalog.Resolve(AppErrorCode.ApiInvalidResponse), retryable: error.retryable),
                    "RATE_LIMITED" => Fail(AppErrorCode.ApiUnavailable, ErrorMessageCatalog.Resolve(AppErrorCode.ApiUnavailable), retryable: error.retryable),
                    "INTERNAL_ERROR" => Fail(AppErrorCode.ApiUnavailable, ErrorMessageCatalog.Resolve(AppErrorCode.ApiUnavailable), retryable: error.retryable),
                    "PAYLOAD_INVALID" => Fail(AppErrorCode.TaskConfigInvalid, ErrorMessageCatalog.Resolve(AppErrorCode.TaskConfigInvalid), retryable: false),
                    _ => Fail(AppErrorCode.ApiUnavailable, ErrorMessageCatalog.Resolve(AppErrorCode.ApiUnavailable), retryable: true),
                };
            }

            if (statusCode == 401)
            {
                return Fail(AppErrorCode.TaskConfigInvalid, ErrorMessageCatalog.Resolve(AppErrorCode.TaskConfigInvalid), retryable: false);
            }

            if (statusCode == 400)
            {
                return Fail(AppErrorCode.TaskConfigInvalid, ErrorMessageCatalog.Resolve(AppErrorCode.TaskConfigInvalid), retryable: false);
            }

            if (statusCode == 422)
            {
                return Fail(AppErrorCode.TaskConfigInvalid, ErrorMessageCatalog.Resolve(AppErrorCode.TaskConfigInvalid), retryable: false);
            }

            if (statusCode == 504)
            {
                return Fail(AppErrorCode.NetworkTimeout, ErrorMessageCatalog.Resolve(AppErrorCode.NetworkTimeout), retryable: true);
            }

            if (statusCode == 429)
            {
                return Fail(AppErrorCode.ApiUnavailable, ErrorMessageCatalog.Resolve(AppErrorCode.ApiUnavailable), retryable: true);
            }

            if (statusCode >= 500)
            {
                return Fail(AppErrorCode.ApiUnavailable, ErrorMessageCatalog.Resolve(AppErrorCode.ApiUnavailable), retryable: true);
            }

            return Fail(AppErrorCode.ApiInvalidResponse, ErrorMessageCatalog.Resolve(AppErrorCode.ApiInvalidResponse), retryable: true);
        }

        private static TaskEvaluationApiResponse Fail(AppErrorCode code, string message, bool retryable)
        {
            return new TaskEvaluationApiResponse
            {
                IsSuccess = false,
                ErrorCode = code,
                Retryable = retryable,
                Message = message,
            };
        }
    }
}
