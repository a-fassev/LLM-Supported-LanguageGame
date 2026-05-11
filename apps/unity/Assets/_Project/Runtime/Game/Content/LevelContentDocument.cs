using System;
using System.Collections.Generic;

namespace ITBL.LanguageGame.Runtime.Game.Content
{
    public enum TaskType
    {
        ErrorHunt = 0,
        DragDrop = 1,
        ClozeText = 2,
        Matching = 3,
        MultipleChoice = 4,
        LlmFreeText = 5,
        LlmWordGuess = 6,
        Unknown = 999,
    }

    public enum UnlockNextTaskWhen
    {
        Always = 0,
        Pass = 1,
        PerfectScore = 2,
    }

    public enum ScoringPolicy
    {
        StrictBinary = 0,
        PartialPoints = 1,
        ThresholdPass = 2,
        Unknown = 999,
    }

    public enum LevelCompletionMode
    {
        AllRequired = 0,
        MinScore = 1,
    }

    [Serializable]
    public sealed class LevelCompletionRuleConfig
    {
        public string mode = "all_required";
        public float minScorePercent;
    }

    [Serializable]
    public sealed class TaskScoringConfig
    {
        public string policy = "strict_binary";
        public int maxPoints = 1;
        public float passThreshold = 1f;
    }

    [Serializable]
    public sealed class MultipleChoiceOption
    {
        public string id = string.Empty;
        public string label = string.Empty;
    }

    [Serializable]
    public sealed class ClozeGapDefinition
    {
        public string gapId = string.Empty;
        public List<string> acceptedAnswers = new();
        public List<string> options = new();
    }

    [Serializable]
    public sealed class MatchingPair
    {
        public string left = string.Empty;
        public string right = string.Empty;
    }

    [Serializable]
    public sealed class LevelTaskDefinition
    {
        public string taskId = string.Empty;
        public string taskType = string.Empty;
        public string prompt = string.Empty;
        public List<string> assets = new();
        public bool requiredToPassLevel = true;
        public string unlockNextTaskWhen = "pass";
        public int maxAttempts;
        public TaskScoringConfig scoring = new();

        public string question = string.Empty;
        public List<MultipleChoiceOption> choices = new();
        public string correctChoiceId = string.Empty;

        public List<string> leftItems = new();
        public List<string> rightItems = new();
        public List<MatchingPair> correctPairs = new();

        public string templateText = string.Empty;
        public List<ClozeGapDefinition> gaps = new();

        public string textWithError = string.Empty;
        public List<string> acceptedCorrections = new();

        public List<string> tokens = new();
        public List<string> correctOrder = new();

        public List<string> evaluationCriteria = new();
        public List<string> targetStructures = new();

        public string targetWord = string.Empty;
        public int maxGuessAttempts = 1;

        public TaskType ResolveTaskType()
        {
            return taskType switch
            {
                "error_hunt" => TaskType.ErrorHunt,
                "drag_drop" => TaskType.DragDrop,
                "cloze_text" => TaskType.ClozeText,
                "matching" => TaskType.Matching,
                "multiple_choice" => TaskType.MultipleChoice,
                "llm_free_text" => TaskType.LlmFreeText,
                "llm_word_guess" => TaskType.LlmWordGuess,
                _ => TaskType.Unknown,
            };
        }

        public UnlockNextTaskWhen ResolveUnlockRule()
        {
            return unlockNextTaskWhen switch
            {
                "always" => UnlockNextTaskWhen.Always,
                "perfect_score" => UnlockNextTaskWhen.PerfectScore,
                _ => UnlockNextTaskWhen.Pass,
            };
        }

        public int ResolveMaxAttempts()
        {
            return maxAttempts <= 0 ? int.MaxValue : maxAttempts;
        }
    }

    [Serializable]
    public sealed class LevelContentDocument
    {
        public string levelId = string.Empty;
        public int version = 1;
        public string displayName = string.Empty;
        public string difficulty = "easy";
        public string theme = string.Empty;
        public List<string> taskOrder = new();
        public LevelCompletionRuleConfig levelCompletionRule = new();
        public List<LevelTaskDefinition> tasks = new();

        public LevelCompletionMode ResolveCompletionMode()
        {
            return levelCompletionRule != null && levelCompletionRule.mode == "min_score"
                ? LevelCompletionMode.MinScore
                : LevelCompletionMode.AllRequired;
        }
    }
}
