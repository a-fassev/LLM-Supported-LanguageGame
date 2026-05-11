using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ITBL.LanguageGame.Runtime.Core;
using ITBL.LanguageGame.Runtime.Game.Content;
using ITBL.LanguageGame.Runtime.Game.Modes;
using ITBL.LanguageGame.Runtime.Infrastructure.Persistence;

namespace ITBL.LanguageGame.Runtime.Game.Flow
{
    public sealed class TaskRuntimeState
    {
        public string TaskId { get; set; } = string.Empty;
        public int AttemptsUsed { get; set; }
        public bool IsPassed { get; set; }
        public int BestScore { get; set; }
        public int ScoreMax { get; set; }
        public bool IsCompleted { get; set; }
    }

    public sealed class TaskStepOutcome
    {
        public bool IsAccepted { get; set; }
        public bool TaskCompleted { get; set; }
        public bool AdvancedToNextTask { get; set; }
        public bool LevelFinished { get; set; }
        public bool LevelPassed { get; set; }
        public bool CanRetry { get; set; }
        public AppErrorCode ErrorCode { get; set; } = AppErrorCode.None;
        public string Message { get; set; } = string.Empty;
        public TaskResult Result { get; set; }
        public LevelTaskDefinition ActiveTask { get; set; }
    }

    public sealed class TaskSequenceOrchestrator
    {
        private readonly LevelContentDocument _document;
        private readonly LevelModeRegistry _modeRegistry;
        private readonly List<LevelTaskDefinition> _orderedTasks;
        private readonly Dictionary<string, TaskRuntimeState> _states;
        private readonly List<TaskRuntimeState> _orderedTaskStates;

        private int _currentTaskIndex;
        private bool _isFinished;

        public TaskSequenceOrchestrator(LevelContentDocument document, LevelModeRegistry modeRegistry)
        {
            _document = document ?? throw new ArgumentNullException(nameof(document));
            _modeRegistry = modeRegistry ?? throw new ArgumentNullException(nameof(modeRegistry));
            _orderedTasks = BuildOrderedTasks(document);
            _states = _orderedTasks.ToDictionary(
                task => task.taskId,
                task => new TaskRuntimeState
                {
                    TaskId = task.taskId,
                    ScoreMax = Math.Max(1, task.scoring.maxPoints),
                });
            _orderedTaskStates = _orderedTasks.ConvertAll(task => _states[task.taskId]);
        }

        public bool IsFinished => _isFinished;
        public int CurrentTaskIndex => _currentTaskIndex;
        public IReadOnlyList<TaskRuntimeState> TaskStates => _orderedTaskStates;
        public LevelTaskDefinition CurrentTask =>
            _isFinished
                ? null
                : _currentTaskIndex >= 0 && _currentTaskIndex < _orderedTasks.Count
                    ? _orderedTasks[_currentTaskIndex]
                    : null;

        public void ApplyResume(LevelAttemptEntry attempt)
        {
            if (attempt == null || attempt.isCompleted || _isFinished)
            {
                return;
            }

            _currentTaskIndex = Math.Clamp(attempt.currentTaskIndex, 0, Math.Max(0, _orderedTasks.Count));

            foreach (TaskAttemptEntry entry in attempt.tasks ?? Enumerable.Empty<TaskAttemptEntry>())
            {
                if (entry == null || string.IsNullOrWhiteSpace(entry.taskId))
                {
                    continue;
                }

                if (!_states.TryGetValue(entry.taskId, out TaskRuntimeState state))
                {
                    continue;
                }

                state.AttemptsUsed = Math.Max(0, entry.attemptsUsed);
                state.IsPassed = entry.passed;
                state.BestScore = Math.Max(0, entry.scoreEarned);
                state.ScoreMax = Math.Max(1, entry.scoreMax);
                state.IsCompleted = entry.completed;
            }
        }

        public async Task<TaskStepOutcome> SubmitAsync(TaskSubmission submission, CancellationToken cancellationToken = default)
        {
            if (_isFinished)
            {
                return new TaskStepOutcome
                {
                    IsAccepted = false,
                    Message = "Das Level ist bereits abgeschlossen.",
                };
            }

            LevelTaskDefinition task = CurrentTask;
            if (task == null)
            {
                return FinishLevel("Keine aktive Aufgabe vorhanden.");
            }

            TaskRuntimeState runtime = _states[task.taskId];
            int maxAttempts = task.ResolveMaxAttempts();
            if (runtime.AttemptsUsed >= maxAttempts)
            {
                return new TaskStepOutcome
                {
                    IsAccepted = false,
                    TaskCompleted = runtime.IsCompleted,
                    CanRetry = false,
                    Message = "Maximale Versuche erreicht.",
                    ActiveTask = task,
                };
            }

            ILevelMode mode = _modeRegistry.Resolve(task.ResolveTaskType());
            TaskSubmission preparedSubmission = submission ?? new TaskSubmission();
            preparedSubmission.TaskId = string.IsNullOrWhiteSpace(preparedSubmission.TaskId) ? task.taskId : preparedSubmission.TaskId;
            preparedSubmission.AttemptNumber = preparedSubmission.AttemptNumber <= 0 ? runtime.AttemptsUsed + 1 : preparedSubmission.AttemptNumber;
            TaskResult result = await mode.EvaluateAsync(task, preparedSubmission, cancellationToken);
            if (result.IsEvaluationError)
            {
                return new TaskStepOutcome
                {
                    IsAccepted = false,
                    TaskCompleted = runtime.IsCompleted,
                    CanRetry = result.RetryRecommended,
                    ErrorCode = result.ErrorCode,
                    Message = string.IsNullOrWhiteSpace(result.Feedback)
                        ? ErrorMessageCatalog.Resolve(result.ErrorCode == AppErrorCode.None ? AppErrorCode.ApiUnavailable : result.ErrorCode)
                        : result.Feedback,
                    Result = result,
                    ActiveTask = task,
                };
            }

            runtime.AttemptsUsed += 1;
            runtime.BestScore = Math.Max(runtime.BestScore, result.ScoreEarned);
            runtime.ScoreMax = Math.Max(runtime.ScoreMax, result.ScoreMax);
            runtime.IsPassed = runtime.IsPassed || result.IsPass;

            bool canAdvance = CanAdvance(task, result);
            bool attemptsRemaining = runtime.AttemptsUsed < maxAttempts;

            if (!canAdvance && attemptsRemaining)
            {
                return new TaskStepOutcome
                {
                    IsAccepted = true,
                    TaskCompleted = false,
                    AdvancedToNextTask = false,
                    CanRetry = true,
                    Message = "Aufgabe noch nicht bestanden. Versuch es erneut.",
                    Result = result,
                    ActiveTask = task,
                };
            }

            if (!canAdvance && !attemptsRemaining)
            {
                runtime.IsCompleted = true;
                return FinishLevel(
                    string.IsNullOrWhiteSpace(result.Feedback)
                        ? "Maximale Versuche erreicht. Das Level ist leider nicht bestanden."
                        : result.Feedback,
                    result);
            }

            runtime.IsCompleted = true;

            _currentTaskIndex += 1;
            bool hasNextTask = _currentTaskIndex < _orderedTasks.Count;
            if (hasNextTask)
            {
                return new TaskStepOutcome
                {
                    IsAccepted = true,
                    TaskCompleted = true,
                    AdvancedToNextTask = true,
                    CanRetry = false,
                    Result = result,
                    Message = result.Feedback,
                    ActiveTask = CurrentTask,
                };
            }

            return FinishLevel(result.Feedback, result);
        }

        public int GetTotalScoreEarned()
        {
            return _states.Values.Sum(item => item.BestScore);
        }

        public int GetTotalScoreMax()
        {
            return Math.Max(1, _states.Values.Sum(item => item.ScoreMax));
        }

        private static List<LevelTaskDefinition> BuildOrderedTasks(LevelContentDocument document)
        {
            Dictionary<string, LevelTaskDefinition> byId = document.tasks.ToDictionary(task => task.taskId, task => task);
            List<LevelTaskDefinition> result = new();
            foreach (string taskId in document.taskOrder)
            {
                if (byId.TryGetValue(taskId, out LevelTaskDefinition task))
                {
                    result.Add(task);
                }
            }

            return result;
        }

        private bool CanAdvance(LevelTaskDefinition task, TaskResult result)
        {
            return task.ResolveUnlockRule() switch
            {
                UnlockNextTaskWhen.Always => true,
                UnlockNextTaskWhen.PerfectScore => result.IsPerfectScore,
                _ => result.IsPass,
            };
        }

        private TaskStepOutcome FinishLevel(string message, TaskResult lastResult = null)
        {
            _isFinished = true;
            _currentTaskIndex = _orderedTasks.Count;
            bool passed = EvaluateLevelPassed();
            return new TaskStepOutcome
            {
                IsAccepted = true,
                TaskCompleted = true,
                AdvancedToNextTask = false,
                LevelFinished = true,
                LevelPassed = passed,
                CanRetry = false,
                Message = message,
                Result = lastResult,
            };
        }

        private bool EvaluateLevelPassed()
        {
            bool requiredTasksPassed = _orderedTasks
                .Where(task => task.requiredToPassLevel)
                .All(task => _states.TryGetValue(task.taskId, out TaskRuntimeState state) && state.IsPassed);

            if (!requiredTasksPassed)
            {
                return false;
            }

            if (_document.ResolveCompletionMode() == LevelCompletionMode.AllRequired)
            {
                return true;
            }

            float percent = (float)GetTotalScoreEarned() / GetTotalScoreMax() * 100f;
            float threshold = _document.levelCompletionRule?.minScorePercent ?? 0f;
            return percent >= threshold;
        }
    }
}
