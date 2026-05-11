using System;
using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.Game.Content;
using ITBL.LanguageGame.Runtime.Game.Flow;
using ITBL.LanguageGame.Runtime.Game.Modes;
using ITBL.LanguageGame.Runtime.Infrastructure.Persistence;
using System.Threading;
using System.Threading.Tasks;
using ITBL.LanguageGame.Runtime.UI.Screens;
using UnityEngine;

namespace ITBL.LanguageGame.Runtime.Game.Levels
{
    public sealed class LevelSceneController : MonoBehaviour
    {
        private enum LevelUxState
        {
            Idle,
            Submitting,
            Success,
            RetryAvailable,
            FailedTerminal,
        }

        private string _activeLevelId;
        private string _activeTaskId = string.Empty;
        private string _statusMessage = "Level wird vorbereitet ...";
        private string _freeTextInput = string.Empty;
        private string _dragDropInput = string.Empty;
        private bool _didPersistCompletion;
        private bool _levelPassed;
        private bool _isSubmitting;
        private LevelUxState _uxState = LevelUxState.Idle;
        private TaskSubmission _lastSubmission;

        private TaskSequenceOrchestrator _orchestrator;
        private LevelAttemptEntry _attempt;
        private readonly System.Collections.Generic.HashSet<string> _recordedTaskIds = new();
        private readonly System.Collections.Generic.Dictionary<string, string> _matchingInputs = new();
        private readonly System.Collections.Generic.Dictionary<string, string> _clozeInputs = new();
        private CancellationTokenSource _submitCts;
        private LevelHudView _hudView;

        private void Start()
        {
            EnsureSceneVisuals();
            _hudView = LevelHudView.Create(transform);
            _statusMessage = "Level wird geladen ...";

            if (!GameRoot.IsReady)
            {
                return;
            }

            _activeLevelId = string.IsNullOrWhiteSpace(GameRoot.Services.AppState.SelectedLevelId)
                ? "level_1"
                : GameRoot.Services.AppState.SelectedLevelId;

            if (!GameRoot.Services.ProgressionService.TryGetLevelDescriptor(_activeLevelId, out LevelDescriptor descriptor))
            {
                ReportError(AppErrorCode.ContentInvalid, $"Missing LevelDescriptor for {_activeLevelId}");
                return;
            }

            LevelModeRegistry modeRegistry = new(new ILevelMode[]
            {
                new MultipleChoiceMode(),
                new MatchingMode(),
                new ClozeTextMode(),
                new ErrorHuntMode(),
                new DragDropMode(),
                new LlmFreeTextMode(GameRoot.Services.TaskEvaluationApiClient),
                new LlmWordGuessMode(GameRoot.Services.TaskEvaluationApiClient),
            });
            LevelContentLoader loader = new(new ContentValidator());
            LevelContentLoadResult loadResult = loader.Load(_activeLevelId, descriptor.ContentRelativePath);
            if (!loadResult.IsSuccess || loadResult.Document == null)
            {
                ReportError(AppErrorCode.ContentInvalid, loadResult.Error);
                return;
            }

            _orchestrator = new TaskSequenceOrchestrator(loadResult.Document, modeRegistry);
            bool resume = GameRoot.Services.RuntimeConfig.resumeLastAttempt;
            _attempt = GameRoot.Services.ProgressionService.BeginLevelAttempt(_activeLevelId, resumeLastAttempt: resume);
            if (_attempt != null && !_attempt.isCompleted)
            {
                _orchestrator.ApplyResume(_attempt);
            }

            _statusMessage = $"Level gestartet: {loadResult.Document.displayName}";
            Debug.Log($"[WP3][Level] Loaded {_activeLevelId} from {descriptor.ContentRelativePath}");
        }

        private void OnDestroy()
        {
            _submitCts?.Cancel();
            _submitCts?.Dispose();
            _submitCts = null;
        }

        private void Update()
        {
            if (!GameRoot.IsReady)
            {
                _hudView?.Refresh(BuildHudData());
                return;
            }

            if (_orchestrator != null && _orchestrator.IsFinished && !_didPersistCompletion)
            {
                PersistAttempt(isCompleted: true, isPassed: _levelPassed);
                _didPersistCompletion = true;
            }

            LevelTaskDefinition currentTask = _orchestrator?.CurrentTask;
            if (currentTask != null && currentTask.taskId != _activeTaskId)
            {
                ResetInputsForTask(currentTask);
            }

            _hudView?.Refresh(BuildHudData());
        }

        private void SubmitCurrentTask(TaskSubmission submission)
        {
            _ = SubmitCurrentTaskAsync(submission);
        }

        private async Task SubmitCurrentTaskAsync(TaskSubmission submission)
        {
            if (_isSubmitting || _orchestrator == null || _orchestrator.CurrentTask == null)
            {
                return;
            }

            _isSubmitting = true;
            _uxState = LevelUxState.Submitting;
            _statusMessage = "Bewerte Antwort ...";
            _submitCts?.Cancel();
            _submitCts?.Dispose();
            _submitCts = new CancellationTokenSource();
            _lastSubmission = CloneSubmission(submission);

            LevelTaskDefinition previousTask = _orchestrator.CurrentTask;
            TaskStepOutcome outcome;
            try
            {
                outcome = await _orchestrator.SubmitAsync(submission, _submitCts.Token);
            }
            catch (OperationCanceledException)
            {
                _statusMessage = "Bewertung wurde abgebrochen.";
                _isSubmitting = false;
                _uxState = LevelUxState.RetryAvailable;
                return;
            }
            finally
            {
                _isSubmitting = false;
            }

            if (!outcome.IsAccepted)
            {
                if (outcome.ErrorCode != AppErrorCode.None)
                {
                    ReportError(outcome.ErrorCode, outcome.Message);
                }

                _statusMessage = string.IsNullOrWhiteSpace(outcome.Message)
                    ? "Eingabe konnte nicht verarbeitet werden."
                    : outcome.Message;
                _uxState = outcome.CanRetry ? LevelUxState.RetryAvailable : LevelUxState.FailedTerminal;
                return;
            }

            if (outcome.TaskCompleted && outcome.Result != null && !_recordedTaskIds.Contains(previousTask.taskId))
            {
                _recordedTaskIds.Add(previousTask.taskId);
                GameRoot.Services.ProgressionService.RecordTaskCompletion(outcome.Result.ScoreEarned);
            }

            PersistAttempt(outcome.LevelFinished, outcome.LevelPassed);
            _levelPassed = outcome.LevelPassed;
            _statusMessage = string.IsNullOrWhiteSpace(outcome.Message)
                ? outcome.Result?.Feedback ?? "Aufgabe verarbeitet."
                : outcome.Message;
            _uxState = outcome.LevelFinished
                ? outcome.LevelPassed
                    ? LevelUxState.Success
                    : LevelUxState.FailedTerminal
                : outcome.CanRetry
                    ? LevelUxState.RetryAvailable
                    : LevelUxState.Success;

            LevelTaskDefinition nowActive = _orchestrator.CurrentTask;
            if (nowActive == null || nowActive.taskId != _activeTaskId)
            {
                ResetInputsForTask(nowActive);
            }

            if (outcome.LevelFinished && outcome.LevelPassed)
            {
                GameRoot.Services.ProgressionService.CompleteLevel(_activeLevelId, awardedPoints: 0);
            }
        }

        private void PersistAttempt(bool isCompleted, bool isPassed)
        {
            if (_attempt == null)
            {
                return;
            }

            _attempt.levelId = _activeLevelId;
            _attempt.currentTaskIndex = _orchestrator.CurrentTaskIndex;
            _attempt.isCompleted = isCompleted;
            _attempt.isPassed = isPassed;
            _attempt.tasks = new System.Collections.Generic.List<TaskAttemptEntry>();
            foreach (TaskRuntimeState state in _orchestrator.TaskStates)
            {
                _attempt.tasks.Add(new TaskAttemptEntry
                {
                    taskId = state.TaskId,
                    attemptsUsed = state.AttemptsUsed,
                    passed = state.IsPassed,
                    scoreEarned = state.BestScore,
                    scoreMax = state.ScoreMax,
                    completed = state.IsCompleted,
                });
            }

            GameRoot.Services.ProgressionService.SaveLevelAttempt(_attempt);
        }

        private TaskSubmission CreateSubmission(string rawText = "")
        {
            LevelTaskDefinition task = _orchestrator?.CurrentTask;
            return new TaskSubmission
            {
                ContractVersion = 1,
                SessionId = _attempt?.attemptId ?? System.Guid.NewGuid().ToString("N"),
                AttemptId = _attempt?.attemptId ?? System.Guid.NewGuid().ToString("N"),
                LevelId = _activeLevelId ?? string.Empty,
                TaskId = task?.taskId ?? string.Empty,
                PromptText = task?.prompt ?? string.Empty,
                RawText = rawText ?? string.Empty,
            };
        }

        private void ReportError(AppErrorCode code, string details)
        {
            _statusMessage = ErrorMessageCatalog.Resolve(code);
            if (GameRoot.IsReady)
            {
                GameRoot.Services.ErrorState.Report(code, details);
            }
        }

        private async Task RetryLastSubmissionAsync()
        {
            if (_isSubmitting || _lastSubmission == null)
            {
                return;
            }

            await SubmitCurrentTaskAsync(CloneSubmission(_lastSubmission));
        }

        private static TaskSubmission CloneSubmission(TaskSubmission source)
        {
            if (source == null)
            {
                return null;
            }

            TaskSubmission copy = new()
            {
                ContractVersion = source.ContractVersion,
                SessionId = source.SessionId,
                AttemptId = source.AttemptId,
                LevelId = source.LevelId,
                TaskId = source.TaskId,
                PromptText = source.PromptText,
                AttemptNumber = source.AttemptNumber,
                RawText = source.RawText,
            };
            foreach (string value in source.Values)
            {
                copy.Values.Add(value);
            }

            return copy;
        }

        private void ResetInputsForTask(LevelTaskDefinition task)
        {
            _activeTaskId = task?.taskId ?? string.Empty;
            _freeTextInput = string.Empty;
            _dragDropInput = string.Empty;
            _matchingInputs.Clear();
            _clozeInputs.Clear();
        }

        private static void EnsureSceneVisuals()
        {
            Camera camera = Camera.main;
            if (camera == null)
            {
                GameObject cameraObject = new("Main Camera");
                camera = cameraObject.AddComponent<Camera>();
                camera.tag = "MainCamera";
            }

            camera.transform.position = new Vector3(0f, 0f, -10f);
            camera.orthographic = true;
            camera.orthographicSize = 6f;
        }

        private LevelHudView.Data BuildHudData()
        {
            LevelTaskDefinition task = _orchestrator?.CurrentTask;
            return new LevelHudView.Data
            {
                ActiveLevelId = _activeLevelId,
                StatusMessage = _statusMessage,
                UxStateText = _uxState.ToString(),
                IsSubmitting = _isSubmitting,
                IsRuntimeReady = GameRoot.IsReady && _orchestrator != null,
                IsFinished = _orchestrator?.IsFinished ?? false,
                TotalScoreEarned = _orchestrator?.GetTotalScoreEarned() ?? 0,
                TotalScoreMax = _orchestrator?.GetTotalScoreMax() ?? 0,
                CurrentTaskIndex = _orchestrator?.CurrentTaskIndex ?? 0,
                Task = task,
                ShowRetry = !_isSubmitting && _uxState == LevelUxState.RetryAvailable && _lastSubmission != null,
                OnBackToHub = () =>
                {
                    if (GameRoot.IsReady)
                    {
                        GameRoot.Services.SceneRouter.LoadScene(GameSceneId.MainHub);
                    }
                },
                OnRetry = () => _ = RetryLastSubmissionAsync(),
                OnSubmitMultipleChoice = SubmitMultipleChoice,
                GetMatchingInput = key => _matchingInputs.TryGetValue(key, out string value) ? value : string.Empty,
                SetMatchingInput = (key, value) => _matchingInputs[key] = value ?? string.Empty,
                OnSubmitMatching = SubmitMatching,
                GetClozeInput = key => _clozeInputs.TryGetValue(key, out string value) ? value : string.Empty,
                SetClozeInput = (key, value) => _clozeInputs[key] = value ?? string.Empty,
                OnSubmitCloze = SubmitCloze,
                FreeTextInput = _freeTextInput,
                SetFreeTextInput = value => _freeTextInput = value ?? string.Empty,
                OnSubmitFreeText = SubmitFreeText,
                DragDropInput = _dragDropInput,
                SetDragDropInput = value => _dragDropInput = value ?? string.Empty,
                OnSubmitDragDrop = SubmitDragDrop,
                OnSubmitUnsupported = SubmitFreeText,
            };
        }

        private void SubmitMultipleChoice(string optionId)
        {
            TaskSubmission submission = CreateSubmission();
            submission.Values.Add(optionId);
            SubmitCurrentTask(submission);
        }

        private void SubmitMatching()
        {
            TaskSubmission submission = CreateSubmission();
            foreach (System.Collections.Generic.KeyValuePair<string, string> pair in _matchingInputs)
            {
                submission.Values.Add($"{pair.Key}=>{pair.Value}");
            }

            SubmitCurrentTask(submission);
        }

        private void SubmitCloze()
        {
            LevelTaskDefinition task = _orchestrator?.CurrentTask;
            if (task == null)
            {
                return;
            }

            TaskSubmission submission = CreateSubmission();
            foreach (ClozeGapDefinition gap in task.gaps)
            {
                _clozeInputs.TryGetValue(gap.gapId, out string value);
                submission.Values.Add(value ?? string.Empty);
            }

            SubmitCurrentTask(submission);
        }

        private void SubmitFreeText()
        {
            SubmitCurrentTask(CreateSubmission(_freeTextInput));
        }

        private void SubmitDragDrop()
        {
            TaskSubmission submission = CreateSubmission();
            foreach (string token in _dragDropInput.Split(',', System.StringSplitOptions.RemoveEmptyEntries))
            {
                submission.Values.Add(token.Trim());
            }

            SubmitCurrentTask(submission);
        }
    }
}
