using System;
using System.Collections.Generic;
using System.Linq;

namespace ITBL.LanguageGame.Runtime.Game.Content
{
    public sealed class ContentValidator
    {
        /// <summary>
        /// Level JSON formats the runtime can parse. Bump when breaking changes require migration.
        /// </summary>
        public static readonly HashSet<int> SupportedLevelContentVersions = new() { 1 };

        public ContentValidationResult Validate(LevelContentDocument document)
        {
            if (document == null)
            {
                return ContentValidationResult.Fail("Level content is missing.");
            }

            if (string.IsNullOrWhiteSpace(document.levelId))
            {
                return ContentValidationResult.Fail("levelId is required.");
            }

            if (document.version <= 0)
            {
                return ContentValidationResult.Fail("version must be >= 1.");
            }

            if (!SupportedLevelContentVersions.Contains(document.version))
            {
                return ContentValidationResult.Fail(
                    $"Unsupported level content version '{document.version}'. Supported: {string.Join(", ", SupportedLevelContentVersions.OrderBy(v => v))}.");
            }

            if (string.IsNullOrWhiteSpace(document.displayName))
            {
                return ContentValidationResult.Fail("displayName is required.");
            }

            if (document.taskOrder == null || document.taskOrder.Count == 0)
            {
                return ContentValidationResult.Fail("taskOrder must contain at least one task id.");
            }

            if (document.tasks == null || document.tasks.Count == 0)
            {
                return ContentValidationResult.Fail("tasks must contain at least one task.");
            }

            HashSet<string> taskIds = new(StringComparer.Ordinal);
            foreach (LevelTaskDefinition task in document.tasks)
            {
                ContentValidationResult taskValidation = ValidateTask(task);
                if (!taskValidation.IsValid)
                {
                    return taskValidation;
                }

                if (!taskIds.Add(task.taskId))
                {
                    return ContentValidationResult.Fail($"Duplicate taskId '{task.taskId}'.");
                }
            }

            foreach (string orderedTaskId in document.taskOrder)
            {
                if (!taskIds.Contains(orderedTaskId))
                {
                    return ContentValidationResult.Fail($"taskOrder references unknown taskId '{orderedTaskId}'.");
                }
            }

            LevelCompletionMode completionMode = document.ResolveCompletionMode();
            if (completionMode == LevelCompletionMode.MinScore)
            {
                float threshold = document.levelCompletionRule?.minScorePercent ?? 0f;
                if (threshold < 0f || threshold > 100f)
                {
                    return ContentValidationResult.Fail("levelCompletionRule.minScorePercent must be between 0 and 100.");
                }
            }

            return ContentValidationResult.Success();
        }

        private static ContentValidationResult ValidateTask(LevelTaskDefinition task)
        {
            if (task == null)
            {
                return ContentValidationResult.Fail("Task entry is null.");
            }

            if (string.IsNullOrWhiteSpace(task.taskId))
            {
                return ContentValidationResult.Fail("taskId is required for each task.");
            }

            if (string.IsNullOrWhiteSpace(task.prompt))
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' is missing prompt.");
            }

            if (task.maxAttempts < 0)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' has invalid maxAttempts.");
            }

            if (task.ResolveTaskType() == TaskType.Unknown)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' has unknown taskType '{task.taskType}'.");
            }

            ContentValidationResult scoringValidation = ValidateScoring(task);
            if (!scoringValidation.IsValid)
            {
                return scoringValidation;
            }

            return task.ResolveTaskType() switch
            {
                TaskType.MultipleChoice => ValidateMultipleChoice(task),
                TaskType.Matching => ValidateMatching(task),
                TaskType.ClozeText => ValidateCloze(task),
                TaskType.ErrorHunt => ValidateErrorHunt(task),
                TaskType.DragDrop => ValidateDragDrop(task),
                TaskType.LlmFreeText => ValidateLlmFreeText(task),
                TaskType.LlmWordGuess => ValidateLlmWordGuess(task),
                _ => ContentValidationResult.Fail($"Task '{task.taskId}' has unsupported task type."),
            };
        }

        private static ContentValidationResult ValidateScoring(LevelTaskDefinition task)
        {
            if (task.scoring == null)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' is missing scoring config.");
            }

            if (task.scoring.maxPoints <= 0)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' has invalid scoring.maxPoints.");
            }

            ScoringPolicy policy = task.scoring.policy switch
            {
                "strict_binary" => ScoringPolicy.StrictBinary,
                "partial_points" => ScoringPolicy.PartialPoints,
                "threshold_pass" => ScoringPolicy.ThresholdPass,
                _ => ScoringPolicy.Unknown,
            };

            if (policy == ScoringPolicy.Unknown)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' has unknown scoring.policy '{task.scoring.policy}'.");
            }

            if (task.scoring.passThreshold < 0f || task.scoring.passThreshold > 1f)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' has invalid scoring.passThreshold.");
            }

            return ContentValidationResult.Success();
        }

        private static ContentValidationResult ValidateMultipleChoice(LevelTaskDefinition task)
        {
            if (string.IsNullOrWhiteSpace(task.question))
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define question.");
            }

            if (task.choices == null || task.choices.Count < 2)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define at least 2 choices.");
            }

            if (string.IsNullOrWhiteSpace(task.correctChoiceId))
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define correctChoiceId.");
            }

            bool exists = task.choices.Any(choice => choice != null && choice.id == task.correctChoiceId);
            return exists
                ? ContentValidationResult.Success()
                : ContentValidationResult.Fail($"Task '{task.taskId}' has unknown correctChoiceId '{task.correctChoiceId}'.");
        }

        private static ContentValidationResult ValidateMatching(LevelTaskDefinition task)
        {
            if (task.leftItems == null || task.leftItems.Count < 2 || task.rightItems == null || task.rightItems.Count < 2)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define at least 2 left and right items.");
            }

            if (task.correctPairs == null || task.correctPairs.Count == 0)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define correctPairs.");
            }

            HashSet<string> leftValues = new(task.leftItems);
            HashSet<string> rightValues = new(task.rightItems);
            foreach (MatchingPair pair in task.correctPairs)
            {
                if (pair == null || !leftValues.Contains(pair.left) || !rightValues.Contains(pair.right))
                {
                    return ContentValidationResult.Fail($"Task '{task.taskId}' has invalid matching pair.");
                }
            }

            return ContentValidationResult.Success();
        }

        private static ContentValidationResult ValidateCloze(LevelTaskDefinition task)
        {
            if (string.IsNullOrWhiteSpace(task.templateText))
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define templateText.");
            }

            if (task.gaps == null || task.gaps.Count == 0)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define at least 1 gap.");
            }

            foreach (ClozeGapDefinition gap in task.gaps)
            {
                if (gap == null || string.IsNullOrWhiteSpace(gap.gapId) || gap.acceptedAnswers == null || gap.acceptedAnswers.Count == 0)
                {
                    return ContentValidationResult.Fail($"Task '{task.taskId}' has invalid gap definition.");
                }
            }

            return ContentValidationResult.Success();
        }

        private static ContentValidationResult ValidateErrorHunt(LevelTaskDefinition task)
        {
            if (string.IsNullOrWhiteSpace(task.textWithError))
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define textWithError.");
            }

            if (task.acceptedCorrections == null || task.acceptedCorrections.Count == 0)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define acceptedCorrections.");
            }

            return ContentValidationResult.Success();
        }

        private static ContentValidationResult ValidateDragDrop(LevelTaskDefinition task)
        {
            if (task.tokens == null || task.tokens.Count < 2 || task.correctOrder == null || task.correctOrder.Count < 2)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define tokens and correctOrder with at least 2 entries.");
            }

            return ContentValidationResult.Success();
        }

        private static ContentValidationResult ValidateLlmFreeText(LevelTaskDefinition task)
        {
            if (task.evaluationCriteria == null || task.evaluationCriteria.Count == 0)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define evaluationCriteria.");
            }

            if (task.targetStructures == null)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define targetStructures.");
            }

            return ContentValidationResult.Success();
        }

        private static ContentValidationResult ValidateLlmWordGuess(LevelTaskDefinition task)
        {
            if (string.IsNullOrWhiteSpace(task.targetWord))
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define targetWord.");
            }

            if (task.maxGuessAttempts <= 0)
            {
                return ContentValidationResult.Fail($"Task '{task.taskId}' must define maxGuessAttempts >= 1.");
            }

            return ContentValidationResult.Success();
        }
    }
}
