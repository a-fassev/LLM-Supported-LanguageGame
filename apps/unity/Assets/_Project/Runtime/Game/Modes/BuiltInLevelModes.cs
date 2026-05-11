using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using ITBL.LanguageGame.Runtime.Game.Content;

namespace ITBL.LanguageGame.Runtime.Game.Modes
{
    public sealed class MultipleChoiceMode : ILevelMode
    {
        public TaskType SupportedType => TaskType.MultipleChoice;

        public Task<TaskResult> EvaluateAsync(LevelTaskDefinition task, TaskSubmission submission, CancellationToken cancellationToken = default)
        {
            string selected = submission?.Values?.FirstOrDefault() ?? string.Empty;
            bool isCorrect = !string.IsNullOrWhiteSpace(selected) && selected == task.correctChoiceId;
            return Task.FromResult(BuildResult(task, isCorrect ? task.scoring.maxPoints : 0, isCorrect ? "Richtig!" : "Leider nicht korrekt."));
        }

        private static TaskResult BuildResult(LevelTaskDefinition task, int earned, string feedback)
        {
            int max = task.scoring.maxPoints;
            return new TaskResult
            {
                ScoreEarned = Math.Clamp(earned, 0, max),
                ScoreMax = max,
                IsPass = max <= 0 ? false : (float)earned / max >= ResolvePassThreshold(task),
                Feedback = feedback,
            };
        }

        private static float ResolvePassThreshold(LevelTaskDefinition task)
        {
            return task.scoring.policy == "threshold_pass"
                ? task.scoring.passThreshold
                : 1f;
        }
    }

    public sealed class MatchingMode : ILevelMode
    {
        public TaskType SupportedType => TaskType.Matching;

        public Task<TaskResult> EvaluateAsync(LevelTaskDefinition task, TaskSubmission submission, CancellationToken cancellationToken = default)
        {
            Dictionary<string, string> submittedPairs = new(StringComparer.Ordinal);
            foreach (string raw in submission?.Values ?? Enumerable.Empty<string>())
            {
                string[] parts = raw.Split(new[] { "=>" }, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 2)
                {
                    submittedPairs[parts[0].Trim()] = parts[1].Trim();
                }
            }

            int correctCount = 0;
            foreach (MatchingPair pair in task.correctPairs)
            {
                if (pair != null && submittedPairs.TryGetValue(pair.left, out string right) && right == pair.right)
                {
                    correctCount += 1;
                }
            }

            int maxScore = Math.Max(1, task.scoring.maxPoints);
            int maxPairs = Math.Max(1, task.correctPairs.Count);
            int earned = (int)Math.Round((double)correctCount / maxPairs * maxScore);
            float ratio = (float)earned / maxScore;
            float threshold = task.scoring.policy == "strict_binary" ? 1f : Math.Max(0f, task.scoring.passThreshold);
            TaskResult result = new TaskResult
            {
                ScoreEarned = Math.Clamp(earned, 0, maxScore),
                ScoreMax = maxScore,
                IsPass = ratio >= threshold,
                Feedback = $"Treffer: {correctCount}/{maxPairs}",
            };
            return Task.FromResult(result);
        }
    }

    public sealed class ClozeTextMode : ILevelMode
    {
        public TaskType SupportedType => TaskType.ClozeText;

        public Task<TaskResult> EvaluateAsync(LevelTaskDefinition task, TaskSubmission submission, CancellationToken cancellationToken = default)
        {
            int max = Math.Max(1, task.scoring.maxPoints);
            int correct = 0;
            for (int i = 0; i < task.gaps.Count; i++)
            {
                string provided = i < submission.Values.Count ? submission.Values[i] : string.Empty;
                if (task.gaps[i].acceptedAnswers.Any(answer => string.Equals(answer, provided, StringComparison.OrdinalIgnoreCase)))
                {
                    correct += 1;
                }
            }

            int maxGaps = Math.Max(1, task.gaps.Count);
            int earned = (int)Math.Round((double)correct / maxGaps * max);
            float threshold = task.scoring.policy == "strict_binary" ? 1f : task.scoring.passThreshold;
            TaskResult result = new TaskResult
            {
                ScoreEarned = Math.Clamp(earned, 0, max),
                ScoreMax = max,
                IsPass = (float)earned / max >= threshold,
                Feedback = $"Korrekte Luecken: {correct}/{maxGaps}",
            };
            return Task.FromResult(result);
        }
    }

    public sealed class ErrorHuntMode : ILevelMode
    {
        public TaskType SupportedType => TaskType.ErrorHunt;

        public Task<TaskResult> EvaluateAsync(LevelTaskDefinition task, TaskSubmission submission, CancellationToken cancellationToken = default)
        {
            string input = submission?.RawText?.Trim() ?? string.Empty;
            bool pass = task.acceptedCorrections.Any(candidate => string.Equals(candidate.Trim(), input, StringComparison.OrdinalIgnoreCase));
            int max = Math.Max(1, task.scoring.maxPoints);
            int earned = pass ? max : 0;
            TaskResult result = new TaskResult
            {
                ScoreEarned = earned,
                ScoreMax = max,
                IsPass = pass,
                Feedback = pass ? "Sehr gut korrigiert." : "Die Korrektur passt noch nicht.",
            };
            return Task.FromResult(result);
        }
    }

    public sealed class DragDropMode : ILevelMode
    {
        public TaskType SupportedType => TaskType.DragDrop;

        public Task<TaskResult> EvaluateAsync(LevelTaskDefinition task, TaskSubmission submission, CancellationToken cancellationToken = default)
        {
            int max = Math.Max(1, task.scoring.maxPoints);
            bool isCorrect = task.correctOrder.SequenceEqual(submission?.Values ?? Enumerable.Empty<string>());
            int earned = isCorrect ? max : 0;
            TaskResult result = new TaskResult
            {
                ScoreEarned = earned,
                ScoreMax = max,
                IsPass = isCorrect,
                Feedback = isCorrect ? "Reihenfolge stimmt." : "Reihenfolge ist nicht korrekt.",
            };
            return Task.FromResult(result);
        }
    }

    public sealed class UnsupportedTaskMode : ILevelMode
    {
        public TaskType SupportedType => TaskType.Unknown;

        public Task<TaskResult> EvaluateAsync(LevelTaskDefinition task, TaskSubmission submission, CancellationToken cancellationToken = default)
        {
            int max = task?.scoring?.maxPoints > 0 ? task.scoring.maxPoints : 1;
            TaskResult result = new TaskResult
            {
                ScoreEarned = 0,
                ScoreMax = max,
                IsPass = false,
                Feedback = "Dieser Aufgabentyp wird aktuell nicht ausgewertet.",
            };
            return Task.FromResult(result);
        }
    }
}
